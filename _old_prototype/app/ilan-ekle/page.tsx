'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IlanEklePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    type: 'Vendre (Sat)',
    category: 'Elektronik',
    location: 'Valentigney (Yakın çevrede)'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return alert('Lütfen ilan başlığı girin.');

    const newListing = { id: Date.now(), ...form };
    const existing = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    localStorage.setItem('voisini_listings', JSON.stringify([newListing, ...existing]));

    alert('İlan başarıyla yayınlandı!');
    router.push('/profil');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 pb-24">
      <h1 className="text-2xl font-black mb-6 text-emerald-600">Yeni İlan Oluştur</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">İlan Başlığı</label>
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 border rounded-xl text-sm" placeholder="Örn: Nespresso Kahve Makinesi" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">İlan Türü</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-3 border rounded-xl text-sm bg-white">
              <option>Vendre (Sat)</option>
              <option>Donner (Bağışla)</option>
              <option>Prêter (Ödünç Ver)</option>
              <option>Louer (Kirala)</option>
              <option>Échanger (Takas Et)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">Kategori</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-3 border rounded-xl text-sm bg-white">
              <option>Elektronik</option>
              <option>Ev & Yaşam</option>
              <option>Bahçe & Hobi</option>
              <option>Çocuk & Bebek</option>
              <option>Spor</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Fiyat / Koşul</label>
          <input type="text" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-3 border rounded-xl text-sm" placeholder="Örn: 1.250 TL veya Ücretsiz" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Açıklama</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border rounded-xl text-sm h-32" placeholder="Ürünün durumu hakkında kısa bilgi verin..."></textarea>
        </div>
        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg">Hemen Yayınla</button>
      </form>
    </div>
  );
}