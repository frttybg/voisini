export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Üst Navigasyon */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-600">
            <a href="#" className="text-emerald-600 font-semibold">Ana Sayfa</a>
            <a href="#" className="hover:text-gray-900 transition">Kategoriler</a>
            <a href="#" className="hover:text-gray-900 transition">Yakınımdakiler</a>
            <a href="#" className="hover:text-gray-900 transition">Mesajlar</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium text-gray-700 hover:text-gray-900">Giriş Yap</button>
            <button className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-emerald-700 transition">
              Üye Ol
            </button>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
            Komşular Arası Paylaşım Platformu
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight max-w-3xl mx-auto mb-6">
            Yakınındaki insanlarla paylaş, sat, kirala, ödünç ver veya takas et.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10">
            Çevrendeki komşularının ikinci el eşyalarını keşfet, güvenle iletişim kur ve sürdürülebilir bir yerel topluluk yarat.
          </p>

          {/* CTA Butonları */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button className="bg-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">
              İlanları Keşfet
            </button>
            <button className="bg-white border border-gray-200 text-gray-900 font-semibold px-8 py-4 rounded-2xl shadow-sm hover:bg-gray-50 transition">
              İlan Ekle
            </button>
            <button className="bg-gray-900 text-white font-semibold px-8 py-4 rounded-2xl shadow-sm hover:bg-gray-800 transition">
              Yakınımdakileri Gör
            </button>
          </div>
        </div>
      </main>

      {/* Alt Bilgi */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        &copy; 2026 voisini.com — Tüm hakları saklıdır.
      </footer>
    </div>
  );
}