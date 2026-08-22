'use client';

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Simüle edilmiş oturum kontrolü (localStorage üzerinden)
    const userSession = localStorage.getItem('voisini_session');
    if (userSession) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('voisini_session');
    setIsLoggedIn(false);
    alert('Çıkış yapıldı.');
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">
          voisini<span className="text-gray-900">.com</span>
        </a>

        {/* Ana Navigasyon */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
          <a href="/" className="hover:text-emerald-600 transition">Ana Sayfa</a>
          <a href="/yakinimdakiler" className="hover:text-emerald-600 transition">Kategoriler</a>
          <a href="/yakinimdakiler" className="hover:text-emerald-600 transition">Yakınımdakiler</a>
          <a href="/ilan-ekle" className="text-emerald-600 font-semibold hover:underline">İlan Ekle</a>
          <a href="/mesajlar" className="hover:text-emerald-600 transition">Mesajlar</a>
          <a href="/profil" className="hover:text-emerald-600 transition">Profil</a>
        </nav>

        {/* Kullanıcı Durumuna Göre Sağ Menü */}
        <div className="flex items-center space-x-4">
          {!isLoggedIn ? (
            <div className="flex items-center space-x-3">
              <a href="/giris" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition">
                Giriş Yap
              </a>
              <a href="/kayit" className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-700 transition shadow-sm">
                Üye Ol
              </a>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-2xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                <span>Hesabım ▾</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
                  <a href="/profil" className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">Profil</a>
                  <a href="/profil" className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">İlanlarım</a>
                  <a href="/mesajlar" className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">Mesajlar</a>
                  <a href="/profil" className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">Bildirimler</a>
                  <a href="/profil" className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">Ayarlar</a>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}