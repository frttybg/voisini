'use client';

import { useState, useEffect } from 'react';

export default function ProfilPage() {
  // Mock veri - API'den veritabanı sorgusuyla çekilecek
  const user = {
    name: 'Ahmet Y.',
    memberSince: 'Ağustos 2026',
    location: 'Valentigney, Fransa',
    rating: '4.8',
    totalOps: 12
  };

  const [activeListings, setActiveListings] = useState<any[]>([]);

  useEffect(() => {
    // localStorage'dan aktif ilanları çek (MVP)
    const saved = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    setActiveListings(saved);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profil Header */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Üyelik: {user.memberSince} • {user.location}</p>
          <div className="flex justify-center md:justify-start gap-4 mt-4">
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg">★ {user.rating} Puan</span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg">{user.totalOps} İşlem</span>
          </div>
        </div>
      </div>

      {/* İlanlar Bölümü */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6">Aktif İlanlarım ({activeListings.length})</h2>
        {activeListings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Henüz bir ilanınız bulunmuyor.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activeListings.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <h4 className="font-bold text-sm truncate">{item.title}</h4>
                <p className="text-emerald-600 font-extrabold text-sm">{item.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geçmiş İşlemler Tablosu (Simülasyon) */}
      <div className="bg-white border rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-4">Geçmiş İlanlar & İşlemler</h2>
        <div className="text-sm text-gray-500 italic">Tamamlanan işlemleriniz burada listelenecektir.</div>
      </div>
    </div>
  );
}