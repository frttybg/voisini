'use client';

import { useState } from 'react';

export default function ReportButton({ targetTitle }: { targetTitle: string }) {
  const [reported, setReported] = useState(false);

  const handleReport = () => {
    const reason = prompt('Şikayet sebebinizi belirtin (Örn: Uygunsuz içerik, yanlış bilgi, spam):');
    if (!reason) return;

    const reports = JSON.parse(localStorage.getItem('voisini_reports') || '[]');
    reports.push({ targetTitle, reason, date: new Date().toISOString() });
    localStorage.setItem('voisini_reports', JSON.stringify(reports));
    setReported(true);
    alert('Şikayetiniz yönetici moderasyon paneline iletildi. Teşekkür ederiz.');
  };

  return (
    <button
      onClick={handleReport}
      disabled={reported}
      className="text-xs text-gray-400 hover:text-red-600 transition underline mt-4 block"
    >
      {reported ? '⚠️ Şikayet Bildirildi' : '🚩 Bu ilanı şikayet et'}
    </button>
  );
}