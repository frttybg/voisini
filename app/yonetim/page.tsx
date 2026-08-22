'use client';

import { useState, useEffect } from 'react';

export default function AdminPanelPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('voisini_reports') || '[]');
    const savedListings = JSON.parse(localStorage.getItem('voisini_listings') || '[]');
    setReports(savedReports);
    setListings(savedListings);
  }, []);

  const handleDeleteListing = (id: number) => {
    const updated = listings.filter(item => item.id !== id);
    setListings(updated);
    localStorage.setItem('voisini_listings', JSON.stringify(updated));
    alert('İlan moderasyon ekibi tarafından yayından kaldırıldı.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-400 tracking-tight">voisini</span>
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Admin Paneli</span>
          </div>
          <a href="/" className="text-sm font-medium text-gray-300 hover:text-white">&larr; Siteye Dön</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow space-y-8">
        
        {/* İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <span className="text-xs text-gray-400 block font-medium">Toplam Aktif İlan</span>
            <span className="text-3xl font-black text-gray-900 mt-1 block">{listings.length}</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <span className="text-xs text-gray-400 block font-medium">Bekleyen Şikâyetler</span>
            <span className="text-3xl font-black text-red-600 mt-1 block">{reports.length}</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <span className="text-xs text-gray-400 block font-medium">Sistem Güvenlik Durumu</span>
            <span className="text-sm font-bold text-emerald-600 mt-2 block bg-emerald-50 px-3 py-1 rounded-xl w-max">Aktif & Korunuyor</span>
          </div>
        </div>

        {/* Şikâyet / Moderasyon Listesi */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Moderatör Bildirimleri & Şikâyetler</h2>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-500">Şu anda incelenmeyi bekleyen herhangi bir şikâyet bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep, idx) => (
                <div key={idx} className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-600">İçerik: {rep.targetTitle}</span>
                    <p className="text-sm text-gray-800 mt-1">Sebep: {rep.reason}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">Tarih: {rep.date}</span>
                  </div>
                  <button
                    onClick={() => alert('Şikâyet arşive kaldırıldı.')}
                    className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition"
                  >
                    Çözüldü İşaretle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* İlan Yönetimi */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tüm İlanları Denetle</h2>
          <div className="divide-y divide-gray-100">
            {listings.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500">Kategori: {item.category} • Tür: {item.typeLabel} • Fiyat: {item.price}</p>
                </div>
                <button
                  onClick={() => handleDeleteListing(item.id)}
                  className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition"
                >
                  Kaldır (Modere Et)
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}