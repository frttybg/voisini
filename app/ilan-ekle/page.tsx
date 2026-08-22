'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, LISTING_TYPES } from '../lib/constants';

export default function IlanEklePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState('vendre');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [exchangeWith, setExchangeWith] = useState('');
  const [description, setDescription] = useState('');
  const [distance, setDistance] = useState('Sana 1.2 km uzaklıkta');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Lütfen bir ilan başlığı girin.');
      return;
    }

    const typeObj = LISTING_TYPES.find(t => t.id === type);

    const newListing = {
      id: Date.now(),
      title,
      category,
      type,
      typeLabel: typeObj ? typeObj.badge : 'Satılık',
      price: type === 'donner' ? 'Ücretsiz' : price ? `${price} TL` : 'Belirtilmedi',
      deposit,
      duration,
      exchangeWith,
      distance,
      user: 'Sen (Aktif Kullanıcı)',
      rating: '5.0',
      description,
      date: 'Yeni eklendi'
    };

    const existing = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    localStorage.setItem('voisini_listings', JSON.stringify([newListing, ...existing]));

    alert('İlanınız başarıyla yayınlandı!');
    router.push('/yakinimdakiler');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Ana Sayfa</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Yeni İlan Oluştur</h1>
          <p className="text-sm text-gray-500 mb-6">Komşularınla paylaşmak istediğin eşyayı detaylarıyla ekle.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">İlan Başlığı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Temiz Bisiklet / Kahve Makinesi"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">İlan Türü</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                >
                  {LISTING_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dinamik Alanlar */}
            {type === 'vendre' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Fiyat (TL)</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Örn: 1500"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>
            )}

            {type === 'louer' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Kiralama Bedeli</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Örn: 150 TL / gün"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Depozito</label>
                  <input
                    type="text"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="Örn: 500 TL"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
              </div>
            )}

            {type === 'preter' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Ödünç Verme Koşulları / Süresi</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Örn: Maksimum 1 hafta"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>
            )}

            {type === 'echanger' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Neyle Takas Etmek İstersin?</label>
                <input
                  type="text"
                  value={exchangeWith}
                  onChange={(e) => setExchangeWith(e.target.value)}
                  placeholder="Örn: Kamp ekipmanları ile takas olur"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Açıklama</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürünün durumu ve teslimat koşulları hakkında bilgi ver..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm"
            >
              Hemen Yayınla
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}