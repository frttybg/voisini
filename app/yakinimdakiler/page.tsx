'use client';

import { useState, useEffect } from 'react';

export default function YakinimdakilerPage() {
  const [selectedType, setSelectedType] = useState('tumu');
  const [listings, setListings] = useState([
    { id: 1, title: 'Temel Trekking Bisikleti', type: 'vendre', typeLabel: 'Satılık', price: '3.500 TL', distance: 'Sana 2.3 km uzaklıkta', category: 'Spor', user: 'Ahmet Y.', rating: '4.8' },
    { id: 2, title: 'Nespresso Kahve Makinesi', type: 'louer', typeLabel: 'Kiralık', price: '150 TL / gün', distance: 'Sana 1.1 km uzaklıkta', category: 'Ev', user: 'Zeynep K.', rating: '4.9' },
  ]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_listings') || '[]');
    if (saved.length > 0) {
      setListings((prev) => [...saved, ...prev]);
    }
  }, []);

  const filteredListings = selectedType === 'tumu' ? listings : listings.filter(l => l.type === selectedType);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Ana Sayfaya Dön</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Yakınındaki İlanlar</h1>
          <p className="text-sm text-gray-600 mt-1">Çevrendeki komşularının paylaştığı eşyaları hemen keşfet.</p>

          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'tumu', label: 'Tümü' },
              { id: 'vendre', label: 'Satılık' },
              { id: 'donner', label: 'Ücretsiz' },
              { id: 'louer', label: 'Kiralık' },
              { id: 'echanger', label: 'Takas' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedType(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedType === filter.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredListings.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="h-48 bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold text-sm relative">
                  <span>Ürün Görseli</span>
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {item.typeLabel}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{item.category}</span>
                    <span className="text-xs text-gray-400 font-medium">{item.distance}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                  <p className="font-extrabold text-emerald-600 text-lg mb-3">{item.price}</p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-gray-50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                    {item.user.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{item.user} <span className="text-amber-500 font-normal">★ {item.rating}</span></span>
                </div>
                <a href="/ilan/detay" className="bg-gray-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-emerald-600 transition">
                  İncele
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}