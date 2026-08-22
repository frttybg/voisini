'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KayitPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', location: 'Valentigney, Fransa' });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) return alert('Lütfen tüm alanları doldurun.');
    
    // Kullanıcıyı kaydet ve oturum aç
    localStorage.setItem('voisini_user', JSON.stringify(form));
    alert('Kayıt başarılı!');
    router.push('/profil');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-black mb-6 text-emerald-600">Voisiniye Katıl</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Ad Soyad</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 border rounded-xl text-sm" placeholder="Ahmet Yılmaz" required />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">E-posta</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 border rounded-xl text-sm" placeholder="komsu@voisini.com" required />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Şifre</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 border rounded-xl text-sm" placeholder="••••••••" required />
        </div>
        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition">Kayıt Ol</button>
      </form>
    </div>
  );
}