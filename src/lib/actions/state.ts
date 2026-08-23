import type { FieldErrors } from "@/lib/validation";

/**
 * Server Action'ların ortak dönüş tipi.
 *
 * Bu dosya bilerek "saf" tutulur: içinde `next/headers` gibi yalnızca
 * sunucuda çalışan hiçbir şey yoktur. Böylece istemci bileşenleri
 * (formlar, modallar) `idleState`'i sorunsuz içe aktarabilir.
 * Sunucuya özel yardımcılar için: actions/shared.ts
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: FieldErrors;
  redirect?: string;
  data?: Record<string, unknown>;
};

export const idleState: ActionState = { ok: false };

export function fail(message: string, errors?: FieldErrors): ActionState {
  return { ok: false, message, errors };
}

export function succeed(message?: string, extra?: Partial<ActionState>): ActionState {
  return { ok: true, message, ...extra };
}
