'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Üst Navigasyon */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
            <a href="/" className="hover:text-emerald-600 transition">Ana Sayfa</a>
            <a href="/yakinimdakiler" className="hover:text-emerald-600 transition">Yakınımdakiler</a>
            <a href="/mesajlar" className="hover:text-emerald-600 transition">Mesajlar</a>
          </nav>

          <div className="flex items-center space-x-4">
            <a href="/giris" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition">Giriş Yap</a>
            <a href="/kayit" className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-700 transition shadow-sm">Üye Ol</a>
          </div>
        </div>
      </header>

      {/* Hero Alanı */}
      <main className="max-w-4xl mx-auto px-4 text-center py-20 flex-grow flex flex-col justify-center">
        <span className="text-emerald-600 text-xs font-bold tracking-widest uppercase bg-emerald-50 px-3 py-1.5 rounded-full w-max mx-auto mb-6">
          KOMŞULAR ARASI PAYLAŞIM PLATFORMU
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
          Yakınındaki insanlarla paylaş, sat, kirala, ödünç ver veya takas et.
        </h1>
        <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-10">
          Çevrendeki komşularının ikinci el eşyalarını keşfet, güvenle iletişim kur ve sürdürülebilir bir yerel topluluk yarat.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a href="/yakinimdakiler" className="w-full sm:w-auto bg-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm">
            İlanları Keşfet
          </a>
          <a href="/ilan-ekle" className="w-full sm:w-auto bg-white text-gray-900 border border-gray-200 font-semibold px-8 py-4 rounded-2xl hover:bg-gray-50 transition text-sm">
            İlan Ekle
          </a>
          <a href="/yakinimdakiler" className="w-full sm:w-auto bg-gray-900 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-emerald-600 transition text-sm">
            Yakınımdakileri Gör
          </a>
        </div>
      </main>

      {/* Alt Bilgi */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © 2026 voisini.com — Tüm hakları saklıdır.
      </footer>
    </div>
  );
}