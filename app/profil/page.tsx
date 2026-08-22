'use client';

import { useState, useEffect } from 'react';

export default function ProfilPage() {
  const [userListings, setUserListings] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_listings') || '[]');
    setUserListings(saved);
  }, []);

  const handleDeleteListing = (id: number) => {
    const updated = userListings.filter(item => item.id !== id);
    setUserListings(updated);
    localStorage.setItem('user_listings', JSON.stringify(updated));
    alert('İlanınız silindi.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Ana Sayfaya Dön</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* Profil Kartı */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              S
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Aktif Kullanıcı (Sen)</h1>
              <p className="text-sm text-gray-500 mt-0.5">Üyelik: Ağustos 2026 • İstanbul, Kadıköy</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg">★ 5.0 Puan</span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg">12 İşlem</span>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">✓ Doğrulanmış Komşu</span>
              </div>
            </div>
          </div>

          <a href="/ilan-ekle" className="bg-emerald-600 text-white font-semibold text-xs px-5 py-3 rounded-xl hover:bg-emerald-700 transition shadow-sm">
            + Yeni İlan Ver
          </a>
        </div>

        {/* Kullanıcının İlanları */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aktif İlanlarım ({userListings.length})</h2>
          
          {userListings.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-500 text-sm">
              Henüz eklediğin bir ilan bulunmuyor. Hemen yukarıdaki butondan ilk ilanını ekleyebilirsin!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userListings.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{item.typeLabel}</span>
                    <h3 className="font-bold text-gray-900 text-sm mt-1">{item.title}</h3>
                    <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{item.price}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteListing(item.id)}
                    className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-100 transition"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}