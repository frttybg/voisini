"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Supabase e-posta bağlantıları için emniyet ağı.
 *
 * Supabase, `redirect_to` adresi izin listesinde yoksa bağlantıyı sessizce
 * "Site URL"e (yani ana sayfaya) yönlendirir. Böyle bir durumda tarayıcının
 * adres çubuğunda `#access_token=…&type=recovery` kalır ama hiçbir şey
 * olmaz — kullanıcı şifre yenileme ekranını hiç göremez.
 *
 * Bu bileşen her sayfada adres parçasını (#) kontrol eder; içinde bir oturum
 * anahtarı bulursa oturumu açar ve bağlantının türüne göre doğru sayfaya
 * götürür. Normal gezinmede hiçbir şey yapmaz.
 */
export function AuthHashCatcher() {
  const { locale } = useI18n();

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;

    const params = new URLSearchParams(raw);
    const loginUrl = `/${locale}/login`;

    if (params.get("error_code") || params.get("error")) {
      window.location.replace(`${loginUrl}?error=link`);
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const type = params.get("type");

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("session");
        const target =
          type === "recovery"
            ? `/${locale}/reset-password`
            : window.location.pathname + window.location.search;
        window.location.replace(target);
      })
      .catch(() => {
        window.location.replace(`${loginUrl}?error=link`);
      });
  }, [locale]);

  return null;
}
