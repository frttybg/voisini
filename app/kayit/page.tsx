'use client';
import { useState } from 'react';

export default function KayitPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });

  const handleRegister = async () => {
    // MVP: Şifre hashleme simülasyonu (Production'da bcrypt.js veya benzeri kullanılır)
    const mockHash = btoa(formData.password); 
    const userData = { ...formData, password: mockHash, id: Date.now() };
    
    localStorage.setItem('voisini_user', JSON.stringify(userData));
    localStorage.setItem('voisini_session', 'true'); // Oturum açıldı
    
    alert('Kayıt başarılı! Aramıza hoş geldin.');
    window.location.href = '/profil';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border w-full max-w-md">
        <h2 className="text-2xl font-black mb-6">Aramıza Katılın</h2>
        <input className="w-full mb-4 p-3 border rounded-xl" placeholder="Ad Soyad" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input className="w-full mb-4 p-3 border rounded-xl" type="email" placeholder="E-posta" onChange={e => setFormData({...formData, email: e.target.value})} />
        <input className="w-full mb-4 p-3 border rounded-xl" type="password" placeholder="Şifre" onChange={e => setFormData({...formData, password: e.target.value})} />
        <input className="w-full mb-6 p-3 border rounded-xl" placeholder="Konum (Şehir/İlçe)" onChange={e => setFormData({...formData, location: e.target.value})} />
        <button onClick={handleRegister} className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold">Kayıt Ol</button>
      </div>
    </div>
  );
}