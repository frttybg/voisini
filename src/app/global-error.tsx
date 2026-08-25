"use client";

/**
 * Kök düzendeki bir hata için son çare. Buraya düşüldüğünde dil
 * bağlamı bile yüklenmemiş olabilir, o yüzden metin sabit ve
 * Fransızca — sitenin varsayılan dili.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#fbfaf7",
          color: "#0a1310",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em" }}>voisini</p>
          <h1 style={{ fontSize: "1.5rem", margin: "16px 0 8px" }}>
            Quelque chose s&apos;est mal passé
          </h1>
          <p style={{ margin: "0 0 24px", color: "#6b807a", lineHeight: 1.6 }}>
            L&apos;erreur vient de chez nous, pas de toi. Réessaie dans un instant.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#0a6b54",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "12px 22px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
          {error.digest ? (
            <p style={{ marginTop: "20px", fontSize: "12px", color: "#8a968f" }}>{error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
