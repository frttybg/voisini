'use client';

import { useState } from 'react';

export default function PaymentModule({ itemTitle, price }: { itemTitle: string, price: string }) {
  const [status, setStatus] = useState('Bekliyor');
  const [loading, setLoading] = useState(false);

  const handleProcessPayment = (newStatus: string) => {
    setLoading(true);
    setTimeout(() => {
      setStatus(newStatus);
      setLoading(false);
      
      // İşlemi localStorage transaction tablosuna kaydedelim
      const transactions = JSON.parse(localStorage.getItem('voisini_transactions') || '[]');
      transactions.push({
        id: Date.now(),
        itemTitle,
        price,
        status: newStatus,
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem('voisini_transactions', JSON.stringify(transactions));

      alert(`İşlem durumu güncellendi: ${newStatus}`);
    }, 800);
  };

  return (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Güvenli Ödeme & Kiralama Paneli</h3>
      <p className="text-xs text-gray-500 mb-4">Faz 3 Ödeme ve Emanet Altyapısı</p>

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-4">
        <div>
          <span className="text-xs text-gray-400 block">İşlem Durumu</span>
          <span className="text-sm font-bold text-emerald-600">{status}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block">Tutar</span>
          <span className="text-base font-extrabold text-gray-900">{price}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading}
          onClick={() => handleProcessPayment('Ödendi')}
          className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition text-xs shadow-sm"
        >
          {loading ? 'İşleniyor...' : 'Ödemeyi Yap (Ödendi)'}
        </button>
        <button
          disabled={loading}
          onClick={() => handleProcessPayment('İptal edildi')}
          className="bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition text-xs"
        >
          İptal Et
        </button>
      </div>
    </div>
  );
}