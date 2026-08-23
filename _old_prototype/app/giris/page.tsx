'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = localStorage.getItem('voisini_user');
    
    if (existing) {
      const user = JSON.parse(existing);
      if (user.email === email) {
        router.push('/profil');
        return;
      }
    }
    
    // Eğer kayıt yoksa yeni oturum aç
    const newUser = { name: email.split('@')[0] || 'Komşu', email, location: 'Valentigney, Fransa' };
    localStorage.setItem('voisini_user', JSON.stringify(newUser));
    router.push('/profil');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-black mb-6 text-emerald-600">Giriş Yap</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">E-posta</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-xl text-sm" placeholder="komsu@voisini.com" required />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Şifre</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-xl text-sm" placeholder="••••••••" required />
        </div>
        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition">Giriş Yap</button>
      </form>
    </div>
  );
}