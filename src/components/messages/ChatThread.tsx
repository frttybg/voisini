"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Overlay";
import { fetchMessagesAction, sendMessageAction } from "@/lib/actions/messages";
import { subscribeToInserts } from "@/lib/realtime/channel";
import type { Message } from "@/lib/supabase/types";

/**
 * Sohbet penceresi.
 *
 * Yeni mesajlar WebSocket üzerinden anında düşer. Bağlantı kurulamazsa
 * (ağ engeli, eski tarayıcı) otomatik olarak yoklamaya geri dönülür;
 * bağlantı varken de 20 saniyede bir emniyet yoklaması yapılır, böylece
 * kopan bir kare gözden kaçmaz.
 */
export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | undefined>(initialMessages.at(-1)?.created_at);
  const lastPull = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const liveRef = useRef(false);

  /** Gelen mesajı listeye ekler; aynı mesaj iki kez eklenmez. */
  const absorb = useCallback(
    (incoming: Message[]) => {
      if (!incoming.length) return;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const fresh = incoming.filter((m) => !ids.has(m.id));
        if (!fresh.length) return prev;

        // Kendi gönderdiğimiz mesaj sunucudan dönerse, geçici kopyayı at.
        const mineBodies = new Set(
          fresh.filter((m) => m.sender_id === currentUserId).map((m) => m.body),
        );
        const kept = prev.filter(
          (m) => !(m.id.startsWith("temp-") && mineBodies.has(m.body)),
        );

        const next = [...kept, ...fresh];
        lastAt.current = next.at(-1)?.created_at ?? lastAt.current;
        return next;
      });
    },
    [currentUserId],
  );

  const pull = useCallback(async () => {
    const fresh = await fetchMessagesAction(conversationId, lastAt.current);
    absorb(fresh);
  }, [conversationId, absorb]);

  // 1. Anlık kanal
  useEffect(() => {
    const unsubscribe = subscribeToInserts<Message>({
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
      onInsert: (row) => absorb([row]),
      onStatus: (connected) => {
        liveRef.current = connected;
        // Bağlantı (yeniden) kurulduğunda arada kaçan varsa toparla
        if (connected) void pull();
      },
    });
    return unsubscribe;
  }, [conversationId, absorb, pull]);

  // 2. Yedek yoklama — bağlantı yoksa sık, varsa seyrek
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => {
      if (!active || document.hidden) return;
      if (liveRef.current && Date.now() - lastPull.current < 20_000) return;
      lastPull.current = Date.now();
      void pull();
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pull]);

  // 3. Sekmeye geri dönünce anında tazele
  useEffect(() => {
    function onVisible() {
      if (!document.hidden) void pull();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [pull]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    startTransition(async () => {
      const fd = new FormData();
      fd.set("conversationId", conversationId);
      fd.set("body", body);
      const result = await sendMessageAction({ ok: false }, fd);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setDraft(body);
        toast(result.message === "rateLimited" ? t.errors.rateLimited : t.common.error, "error");
        return;
      }
      const fresh = await fetchMessagesAction(conversationId, lastAt.current);
      if (fresh.length) {
        lastAt.current = fresh.at(-1)?.created_at ?? lastAt.current;
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"));
          const ids = new Set(withoutTemp.map((m) => m.id));
          return [...withoutTemp, ...fresh.filter((m) => !ids.has(m.id))];
        });
      }
    });
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-0">
        <div className="flex flex-col gap-2">
          {messages.map((message) => {
            const mine = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-[var(--radius-lg)] px-4 py-2.5 text-[0.9375rem] leading-relaxed",
                    mine
                      ? "rounded-ee-sm bg-[var(--brand-600)] text-white"
                      : "rounded-es-sm border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)]",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <span
                    className={cn(
                      "mt-1 block text-end text-[0.625rem]",
                      mine ? "text-white/70" : "text-[var(--ink-muted)]",
                    )}
                  >
                    {new Date(message.created_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {mine && message.read_at ? " ✓✓" : mine ? " ✓" : ""}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={send}
        className="sticky bottom-0 flex items-end gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-3 sm:px-0"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder={t.nav.messages}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3 text-[0.9375rem] outline-none focus:border-[var(--brand-400)]"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          aria-label={t.hero.search}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-600)] text-white transition-transform active:scale-90 disabled:opacity-40"
        >
          <Icon name="send" size={18} />
        </button>
      </form>
    </>
  );
}
