'use client';
import { useState, useEffect } from 'react';

export default function YakinimdakilerPage() {
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    setListings(saved);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-black mb-2 text-emerald-600">Yakınındaki Komşular</h1>
      <p className="text-xs text-gray-500 mb-6">Konumun etrafındaki aktif paylaşım ve ilanlar</p>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8">
          <p className="text-sm text-gray-400 mb-4">Henüz çevrenizde listelenen bir ilan bulunmuyor.</p>
          <a href="/ilan-ekle" className="inline-block bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-xl">İlk İlanı Sen Ekle</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{item.type}</span>
                <h3 className="font-bold text-lg mt-3">{item.title}</h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="font-extrabold text-gray-900">{item.price || 'Ücretsiz'}</span>
                <span className="text-[10px] text-gray-400">📍 1.2 km uzaklıkta</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}