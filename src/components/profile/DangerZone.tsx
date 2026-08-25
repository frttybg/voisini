"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal, useToast } from "@/components/ui/Overlay";
import {
  cancelAccountDeletionAction,
  requestAccountDeletionAction,
} from "@/lib/actions/auth";

/**
 * Hesap silme. Gizlilik politikasında verdiğimiz söz burada uygulanıyor:
 * hesap hemen gizlenir, 30 gün sonra kalıcı olarak silinir, o güne kadar
 * vazgeçilebilir.
 */
export function DangerZone({
  locale,
  deletionPending,
}: {
  locale: string;
  deletionPending: boolean;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      await requestAccountDeletionAction(locale);
    });
  }

  function undo() {
    startTransition(async () => {
      const result = await cancelAccountDeletionAction();
      toast(result.ok ? t.common.saved : t.common.error, result.ok ? "success" : "error");
    });
  }

  if (deletionPending) {
    return (
      <section
        className="mt-10 rounded-[var(--radius-lg)] border p-5"
        style={{
          borderColor: "color-mix(in oklab, var(--warning) 40%, var(--line))",
          background: "color-mix(in oklab, var(--warning) 8%, transparent)",
        }}
      >
        <h2 className="mb-1 flex items-center gap-2 text-[0.9375rem] font-bold text-[var(--ink)]">
          <Icon name="clock" size={16} />
          {t.danger.pending}
        </h2>
        <p className="mb-4 max-w-prose text-sm text-[var(--ink-soft)]">{t.danger.pendingText}</p>
        <Button variant="outline" disabled={pending} onClick={undo}>
          {t.danger.undo}
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--line)] p-5">
      <h2 className="mb-1 text-[0.9375rem] font-bold text-[var(--ink)]">{t.danger.title}</h2>
      <p className="mb-4 max-w-prose text-sm text-[var(--ink-muted)]">{t.danger.text}</p>

      <Button
        variant="ghost"
        icon="trash"
        onClick={() => setOpen(true)}
        className="text-[var(--danger)]"
      >
        {t.danger.button}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t.danger.confirmTitle}>
        <p className="mb-6 text-sm leading-relaxed text-[var(--ink-soft)]">
          {t.danger.confirmText}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={pending}
            onClick={confirmDelete}
            className="flex-1 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--danger)" }}
          >
            {t.danger.confirm}
          </button>
          <Button full variant="outline" disabled={pending} onClick={() => setOpen(false)}>
            {t.danger.cancel}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
