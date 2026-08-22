'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, LISTING_TYPES } from '../lib/constants';

export default function IlanEklePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '', description: '', category: CATEGORIES[0], type: 'vendre',
    price: '', deposit: '', duration: '', exchangeWith: ''
  });

  // Fotoğraf Yükleme Mantığı
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newListing = { ...formData, id: Date.now(), photos, date: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    localStorage.setItem('voisini_listings', JSON.stringify([newListing, ...existing]));
    alert('İlanınız başarıyla yayınlandı!');
    router.push('/yakinimdakiler');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border shadow-sm space-y-6">
        <h1 className="text-2xl font-black">İlan Oluştur</h1>

        {/* Fotoğraf Alanı */}
        <div>
          <label className="block text-sm font-bold mb-2">Fotoğraflar (Mobil Kameradan Yüklenebilir)</label>
          <input type="file" multiple accept="image/*" capture="environment" onChange={handlePhotoUpload} className="w-full mb-2 p-2 border rounded-xl" />
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((p, i) => (
              <div key={i} className="relative w-20 h-20 flex-shrink-0">
                <img src={p} className="w-full h-full object-cover rounded-xl" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
        </div>

        <input className="w-full p-3 border rounded-xl" placeholder="Başlık (Örn: Bisiklet)" onChange={e => setFormData({...formData, title: e.target.value})} />
        <textarea className="w-full p-3 border rounded-xl" rows={3} placeholder="Açıklama..." onChange={e => setFormData({...formData, description: e.target.value})} />
        
        <select className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, category: e.target.value})}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, type: e.target.value})}>
          {LISTING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        {/* Dinamik Alanlar */}
        {formData.type === 'vendre' && <input className="w-full p-3 border rounded-xl" placeholder="Fiyat (TL)" onChange={e => setFormData({...formData, price: e.target.value})} />}
        {formData.type === 'louer' && <><input className="w-full p-3 border rounded-xl" placeholder="Kiralama Ücreti" onChange={e => setFormData({...formData, price: e.target.value})} /><input className="w-full p-3 border rounded-xl" placeholder="Depozito" onChange={e => setFormData({...formData, deposit: e.target.value})} /></>}
        {formData.type === 'preter' && <input className="w-full p-3 border rounded-xl" placeholder="İade Koşulları ve Süre" onChange={e => setFormData({...formData, duration: e.target.value})} />}
        {formData.type === 'echanger' && <input className="w-full p-3 border rounded-xl" placeholder="Neyle takas edeceksin?" onChange={e => setFormData({...formData, exchangeWith: e.target.value})} />}

        <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold">Yayınla</button>
      </form>
    </div>
  );
}