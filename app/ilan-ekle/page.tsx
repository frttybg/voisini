'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IlanEklePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Spor');
  const [type, setType] = useState('vendre');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      alert('Lütfen başlık ve fiyat alanlarını doldurun.');
      return;
    }

    // Yeni ilanı oluşturalım
    const newListing = {
      id: Date.now(),
      title,
      category,
      type,
      typeLabel: type === 'vendre' ? 'Satılık' : type === 'louer' ? 'Kiralık' : type === 'donner' ? 'Ücretsiz' : 'Takas',
      price: price + ' TL',
      distance: 'Sana 500 m uzaklıkta',
      user: 'Sen (Aktif Kullanıcı)',
      rating: '5.0',
      description,
    };

    // Mevcut ilanları localStorage'dan alalım veya boş array başlatalım
    const existing = JSON.parse(localStorage.getItem('user_listings') || '[]');
    localStorage.setItem('user_listings', JSON.stringify([newListing, ...existing]));

    alert('İlanınız başarıyla eklendi!');
    router.push('/yakinimdakiler');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Ana Sayfaya Dön</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Yeni İlan Ekle</h1>
          <p className="text-sm text-gray-500 mb-6">Komşularınızla paylaşmak istediğiniz eşyayı ekleyin.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">İlan Başlığı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Temiz Bisiklet"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                >
                  <option value="Spor">Spor</option>
                  <option value="Ev">Ev & Yaşam</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Çocuk">Çocuk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">İlan Türü</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                >
                  <option value="vendre">Satılık</option>
                  <option value="louer">Kiralık</option>
                  <option value="donner">Ücretsiz</option>
                  <option value="echanger">Takas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Fiyat / Değer</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Örn: 1500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Açıklama</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürünün durumu hakkında kısa bilgi verin..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm"
            >
              İlanı Yayınla
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}