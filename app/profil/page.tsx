'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState({ name: 'Komşu', email: '', location: 'Valentigney, Fransa', memberSince: 'Ağustos 2026', rating: '4.8', totalOps: 12 });
  const [activeListings, setActiveListings] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('voisini_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(prev => ({
        ...prev,
        name: parsed.name || parsed.email.split('@')[0],
        email: parsed.email,
        location: parsed.location || 'Valentigney, Fransa'
      }));
    }

    const savedListings = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    setActiveListings(savedListings);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('voisini_user');
    router.push('/giris');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.email} • Üyelik: {user.memberSince} • 📍 {user.location}</p>
          <div className="flex justify-center md:justify-start gap-4 mt-4">
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg">★ {user.rating} Puan</span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg">{user.totalOps} İşlem</span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-xs text-red-500 font-bold border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition">Çıkış Yap</button>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6">Aktif İlanlarım ({activeListings.length})</h2>
        {activeListings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Henüz bir ilanınız bulunmuyor. Yeni ilan ekleyerek komşularınızla paylaşın!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activeListings.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <h4 className="font-bold text-sm truncate">{item.title}</h4>
                <p className="text-emerald-600 font-extrabold text-sm">{item.price || 'Ücretsiz'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-4">Geçmiş İlanlar & İşlemler</h2>
        <div className="text-sm text-gray-500 italic">Tamamlanan işlemleriniz burada listelenecektir.</div>
      </div>
    </div>
  );
}