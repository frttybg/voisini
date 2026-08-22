'use client';

import { useState } from 'react';

export default function IlanEklePage() {
  const [listingType, setListingType] = useState('vendre');

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık */}
        <div className="mb-8">
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline mb-2 inline-block">&larr; Ana Sayfaya Dön</a>
          <h1 className="text-3xl font-extrabold text-gray-900">Yeni İlan Oluştur</h1>
          <p className="text-gray-600 text-sm mt-1">Komşularına yardım et, paylaş veya eşyalarını değerlendir.</p>
        </div>

        {/* Form Kartı */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* İlan Türü Seçimi */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">İlan Türü Seçin</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'vendre', label: 'Sat', desc: 'Vendre' },
                { id: 'donner', label: 'Ücretsiz', desc: 'Donner' },
                { id: 'preter', label: 'Ödünç Ver', desc: 'Prêter' },
                { id: 'louer', label: 'Kirala', desc: 'Louer' },
                { id: 'echanger', label: 'Takas Et', desc: 'Échanger' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setListingType(type.id)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                    listingType === type.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 font-medium'
                  }`}
                >
                  <span className="text-sm">{type.label}</span>
                  <span className="text-[10px] text-gray-400 font-normal">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* İlan Başlığı */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">İlan Başlığı</label>
            <input
              type="text"
              placeholder="Örn: Temiz Trekking Bisikleti veya Nespresso Kahve Makinesi"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Kategori</label>
            <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-white">
              <option>Elektronik</option>
              <option>Ev ve Yaşam</option>
              <option>Mobilya</option>
              <option>Giyim</option>
              <option>Çocuk & Bebek</option>
              <option>Spor & Outdoor</option>
              <option>Kitap & Hobi</option>
              <option>Araç & Bahçe</option>
            </select>
          </div>

          {/* Dinamik Alanlar (İlan Türüne Göre) */}
          {listingType === 'vendre' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Fiyat (TL)</label>
              <input type="number" placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
            </div>
          )}

          {listingType === 'louer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Kira Bedeli (Günlük/Haftalık)</label>
                <input type="number" placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Depozito</label>
                <input type="number" placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
              </div>
            </div>
          )}

          {listingType === 'echanger' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Neyle Takas Etmek İstersin?</label>
              <input type="text" placeholder="Örn: Akıllı saat ile takas olur" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" />
            </div>
          )}

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Açıklama</label>
            <textarea
              rows={4}
              placeholder="Ürünün durumu, kullanım süresi veya teslim alma koşulları hakkında bilgi verin..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
            ></textarea>
          </div>

          {/* Fotoğraf Yükleme Alanı */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Fotoğraflar</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-emerald-600 transition cursor-pointer">
              <p className="text-sm text-gray-600 font-medium">Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max. 5MB)</p>
            </div>
          </div>

          {/* Gönder Butonu */}
          <button
            type="button"
            onClick={() => alert('İlan başarıyla oluşturuldu! (MVP simülasyonu)')}
            className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-center"
          >
            İlanı Yayınla
          </button>

        </div>
      </div>
    </div>
  );
}