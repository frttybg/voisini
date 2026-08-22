'use client';

export default function ProfilPage() {
  const userListings = [
    { id: 1, title: 'Temel Trekking Bisikleti', type: 'Satılık', price: '3.500 TL', location: 'Sana 2.3 km uzaklıkta', date: '2 gün önce' },
    { id: '2', title: 'Nespresso Kahve Makinesi', type: 'Kiralık', price: '150 TL / gün', location: 'Sana 1.1 km uzaklıkta', date: '5 gün önce' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Üst Navigasyon */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Ana Sayfaya Dön</a>
        </div>
      </header>

      {/* Profil İçeriği */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        
        {/* Kullanıcı Kartı */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-700 font-extrabold text-3xl rounded-full flex items-center justify-center shadow-inner">
            AY
          </div>
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-2xl font-bold text-gray-900">Ahmet Yılmaz</h1>
            <p className="text-sm text-gray-500 mt-1">Üyelik Tarihi: Şubat 2026 • Konum: Merkez Mah.</p>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
                ★ 4.8 Komşu Puanı
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                12 Tamamlanan İşlem
              </span>
            </div>
          </div>
        </div>

        {/* Kullanıcının İlanları */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aktif İlanlarım</h2>
          <div className="space-y-4">
            {userListings.map((listing) => (
              <div key={listing.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg inline-block mb-2">
                    {listing.type}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base">{listing.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{listing.location} • {listing.date}</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="font-bold text-emerald-600 text-base">{listing.price}</span>
                  <button 
                    onClick={() => alert('İlan düzenleme simülasyonu')}
                    className="bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-200 transition"
                  >
                    Düzenle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}