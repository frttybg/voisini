/**
 * Bağımlılıksız Supabase (PostgREST) istemcisi.
 *
 * Neden kendi istemcimiz? Bu proje sıfır ek npm bağımlılığı ile çalışacak
 * şekilde kuruldu. PostgREST saf HTTP olduğu için ince bir katman yeterli;
 * RLS politikaları veritabanı tarafında zaten uygulanıyor.
 */

import { publicEnv } from "@/lib/env";

export class PostgrestError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  status: number;

  constructor(message: string, status: number, extra?: Record<string, unknown>) {
    super(message);
    this.name = "PostgrestError";
    this.status = status;
    this.code = extra?.code as string | undefined;
    this.details = extra?.details as string | undefined;
    this.hint = extra?.hint as string | undefined;
  }
}

export type Ctx = {
  url: string;
  anonKey: string;
  /** Kullanıcının access token'ı — verilmezse anon (RLS: herkese açık) */
  token?: string;
  /** service_role kullanılıyorsa RLS atlanır; yalnızca sunucu tarafı */
  serviceRole?: boolean;
};

type Order = { column: string; ascending: boolean; nullsFirst?: boolean };

export type Result<T> = { data: T; error: null } | { data: null; error: PostgrestError };

function buildHeaders(ctx: Ctx, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: ctx.anonKey,
    "Content-Type": "application/json",
    ...extra,
  };
  headers.Authorization = `Bearer ${ctx.token ?? ctx.anonKey}`;
  return headers;
}

class Query<T> implements PromiseLike<Result<T>> {
  private filters: string[] = [];
  private columns = "*";
  private orders: Order[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private singleMode: "none" | "single" | "maybe" = "none";
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private body?: unknown;
  private prefer: string[] = [];
  private countMode?: "exact" | "planned";

  constructor(
    private ctx: Ctx,
    private table: string,
  ) {}

  select(columns = "*") {
    this.columns = columns;
    if (this.method !== "GET") this.prefer.push("return=representation");
    return this;
  }

  count(mode: "exact" | "planned" = "exact") {
    this.countMode = mode;
    return this;
  }

  eq(column: string, value: unknown) { return this.filter(column, "eq", value); }
  neq(column: string, value: unknown) { return this.filter(column, "neq", value); }
  gt(column: string, value: unknown) { return this.filter(column, "gt", value); }
  gte(column: string, value: unknown) { return this.filter(column, "gte", value); }
  lt(column: string, value: unknown) { return this.filter(column, "lt", value); }
  lte(column: string, value: unknown) { return this.filter(column, "lte", value); }
  like(column: string, pattern: string) { return this.filter(column, "like", pattern); }
  ilike(column: string, pattern: string) { return this.filter(column, "ilike", pattern); }
  is(column: string, value: null | boolean) { return this.filter(column, "is", value); }
  contains(column: string, value: unknown[]) {
    this.filters.push(`${column}=cs.{${value.map(String).join(",")}}`);
    return this;
  }
  in(column: string, values: readonly unknown[]) {
    const list = values.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
    this.filters.push(`${column}=in.(${list})`);
    return this;
  }
  or(expression: string) {
    this.filters.push(`or=(${expression})`);
    return this;
  }

  private filter(column: string, op: string, value: unknown) {
    this.filters.push(`${encodeURIComponent(column)}=${op}.${encodeURIComponent(String(value))}`);
    return this;
  }

  order(column: string, opts: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    this.orders.push({
      column,
      ascending: opts.ascending ?? true,
      nullsFirst: opts.nullsFirst,
    });
    return this;
  }

  limit(n: number) { this.limitValue = n; return this; }
  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() { this.singleMode = "single"; return this; }
  maybeSingle() { this.singleMode = "maybe"; return this; }

  insert(values: unknown) {
    this.method = "POST";
    this.body = values;
    this.prefer.push("return=representation");
    return this;
  }

  upsert(values: unknown, opts: { onConflict?: string } = {}) {
    this.method = "POST";
    this.body = values;
    this.prefer.push("return=representation", "resolution=merge-duplicates");
    if (opts.onConflict) this.filters.push(`on_conflict=${opts.onConflict}`);
    return this;
  }

  update(values: unknown) {
    this.method = "PATCH";
    this.body = values;
    this.prefer.push("return=representation");
    return this;
  }

  delete() {
    this.method = "DELETE";
    this.prefer.push("return=representation");
    return this;
  }

  private buildUrl(): string {
    const params: string[] = [];
    if (this.method === "GET" || this.prefer.includes("return=representation")) {
      params.push(`select=${encodeURIComponent(this.columns)}`);
    }
    params.push(...this.filters);
    if (this.orders.length) {
      const spec = this.orders
        .map((o) => `${o.column}.${o.ascending ? "asc" : "desc"}${o.nullsFirst === undefined ? "" : o.nullsFirst ? ".nullsfirst" : ".nullslast"}`)
        .join(",");
      params.push(`order=${encodeURIComponent(spec)}`);
    }
    if (this.limitValue !== undefined) params.push(`limit=${this.limitValue}`);
    if (this.offsetValue !== undefined) params.push(`offset=${this.offsetValue}`);
    return `${this.ctx.url}/rest/v1/${this.table}?${params.join("&")}`;
  }

  async run(): Promise<Result<T>> {
    const prefer = [...this.prefer];
    if (this.singleMode !== "none") prefer.push("count=none");
    if (this.countMode) prefer.push(`count=${this.countMode}`);

    const headers = buildHeaders(this.ctx, {
      ...(prefer.length ? { Prefer: prefer.join(",") } : {}),
      ...(this.singleMode !== "none"
        ? { Accept: "application/vnd.pgrst.object+json" }
        : {}),
    });

    let res: Response;
    try {
      res = await fetch(this.buildUrl(), {
        method: this.method,
        headers,
        body: this.body === undefined ? undefined : JSON.stringify(this.body),
        cache: "no-store",
      });
    } catch (e) {
      return { data: null, error: new PostgrestError((e as Error).message, 0) };
    }

    const text = await res.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!res.ok) {
      // maybeSingle: 0 satır = hata değil
      const info = (payload ?? {}) as Record<string, unknown>;
      if (this.singleMode === "maybe" && (info.code === "PGRST116" || res.status === 406)) {
        return { data: null as T, error: null };
      }
      return {
        data: null,
        error: new PostgrestError(
          (info.message as string) ?? `İstek başarısız (${res.status})`,
          res.status,
          info,
        ),
      };
    }

    return { data: payload as T, error: null };
  }

  then<R1 = Result<T>, R2 = never>(
    onfulfilled?: ((value: Result<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export function createRestClient(ctx: Ctx) {
  return {
    ctx,
    from<T = unknown>(table: string) {
      return new Query<T>(ctx, table);
    },
    async rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<Result<T>> {
      try {
        const res = await fetch(`${ctx.url}/rest/v1/rpc/${fn}`, {
          method: "POST",
          headers: buildHeaders(ctx),
          body: JSON.stringify(args),
          cache: "no-store",
        });
        const text = await res.text();
        const payload = text ? JSON.parse(text) : null;
        if (!res.ok) {
          const info = (payload ?? {}) as Record<string, unknown>;
          return {
            data: null,
            error: new PostgrestError(
              (info.message as string) ?? `RPC başarısız (${res.status})`,
              res.status,
              info,
            ),
          };
        }
        return { data: payload as T, error: null };
      } catch (e) {
        return { data: null, error: new PostgrestError((e as Error).message, 0) };
      }
    },
    storage: {
      publicUrl(bucket: string, path: string) {
        return `${ctx.url}/storage/v1/object/public/${bucket}/${path}`;
      },
      async upload(bucket: string, path: string, body: ArrayBuffer | Blob, contentType: string) {
        const res = await fetch(
          `${ctx.url}/storage/v1/object/${bucket}/${encodeURI(path)}`,
          {
            method: "POST",
            headers: {
              apikey: ctx.anonKey,
              Authorization: `Bearer ${ctx.token ?? ctx.anonKey}`,
              "Content-Type": contentType,
              "x-upsert": "true",
            },
            body: body as BodyInit,
          },
        );
        if (!res.ok) {
          const t = await res.text();
          return { data: null, error: new PostgrestError(t || "Yükleme başarısız", res.status) };
        }
        return { data: { path }, error: null as null };
      },
      async remove(bucket: string, paths: string[]) {
        const res = await fetch(`${ctx.url}/storage/v1/object/${bucket}`, {
          method: "DELETE",
          headers: buildHeaders(ctx),
          body: JSON.stringify({ prefixes: paths }),
        });
        return res.ok;
      },
    },
  };
}

export type RestClient = ReturnType<typeof createRestClient>;

export function anonContext(): Ctx {
  return { url: publicEnv.supabaseUrl, anonKey: publicEnv.supabaseAnonKey };
}
