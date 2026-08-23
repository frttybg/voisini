'use client';

export default function IlanDetayPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Üst Navigasyon */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/yakinimdakiler" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Listeye Dön</a>
        </div>
      </header>

      {/* Ana Detay İçeriği */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sol: Fotoğraf Alanı */}
          <div className="space-y-4">
            <div className="h-80 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-lg shadow-inner">
              Ürün Büyük Fotoğrafı
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 bg-gray-100 rounded-xl"></div>
              <div className="h-20 bg-gray-100 rounded-xl"></div>
              <div className="h-20 bg-gray-100 rounded-xl"></div>
            </div>
          </div>

          {/* Sağ: Bilgiler ve Satıcı İletişim */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">Satılık • Spor</span>
                <span className="text-xs text-gray-500">Sana 2.3 km uzaklıkta</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Temel Trekking Bisikleti</h1>
              <p className="text-3xl font-extrabold text-emerald-600 mb-6">3.500 TL</p>
              
              <div className="border-t border-b border-gray-100 py-4 mb-6">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Açıklama</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Çok temiz kullanılmış trekking bisikleti. Vites geçişlerinde hiçbir sorun yoktur. Model yükselteceğim için satıyorum. Yakın çevreden gelip görebilirsiniz.
                </p>
              </div>

              {/* Satıcı Bilgisi */}
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl mb-6">
                <div className="w-12 h-12 bg-emerald-600 text-white font-bold text-lg rounded-full flex items-center justify-center">
                  AY
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Ahmet Yılmaz</h4>
                  <p className="text-xs text-gray-500">★ 4.8 Komşu Puanı • 12 İşlem</p>
                </div>
              </div>
            </div>

            {/* CTA Mesaj Gönder */}
            <a
              href="/mesajlar"
              className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-center text-sm block"
            >
              Satıcıyla İletişime Geç (Mesaj At)
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}