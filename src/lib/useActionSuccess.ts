"use client";

import { useEffect, useRef } from "react";
import type { ActionState } from "@/lib/actions/state";

/**
 * Bir sunucu eyleminin BAŞARILI sonucunu yalnızca bir kez işler.
 *
 * useActionState'in döndürdüğü state nesnesi başarıdan sonra olduğu gibi
 * kalır. Doğrudan `useEffect(..., [state, toast, onClose, ...])` yazıldığında,
 * her render'da yeniden yaratılan bu bağımlılıklar yüzünden efekt tekrar
 * tekrar çalışır ve aynı bildirim üst üste gösterilir.
 *
 * Burada state NESNESİNİN kimliğini saklıyoruz: her yeni gönderim yeni bir
 * nesne ürettiği için her başarı tam olarak bir kez işlenir.
 */
export function useActionSuccess(state: ActionState, onSuccess: () => void) {
  const handled = useRef<ActionState | null>(null);
  const callback = useRef(onSuccess);

  // Bu efekt her render'dan sonra, aşağıdakinden önce çalışır; böylece
  // callback her zaman güncel olur ama bağımlılık listesini kirletmez.
  useEffect(() => {
    callback.current = onSuccess;
  });

  useEffect(() => {
    if (!state.ok) return;
    if (handled.current === state) return;
    handled.current = state;
    callback.current();
  }, [state]);
}
