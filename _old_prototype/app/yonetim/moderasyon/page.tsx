'use client';

export default function ModerasyonPage() {
  const securityRules = [
    { id: 1, rule: 'Aynı IP üzerinden 5 dakikada 3+ ilan açılması', action: 'Otomatik Engelle' },
    { id: 2, rule: 'Şüpheli kelimeler (özel numara, iban, dış site linki)', action: 'İncelemeye Al' },
    { id: 3, rule: 'Profil fotoğrafı olmayan doğrulanmamış kullanıcı', action: 'Kısıtla' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Gelişmiş Moderasyon ve Dolandırıcılık Önleme</h1>
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold mb-4">Otomatik Güvenlik Kuralları</h3>
        {securityRules.map((r) => (
          <div key={r.id} className="flex justify-between items-center py-3 border-b">
            <span className="text-sm">{r.rule}</span>
            <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-lg">{r.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}