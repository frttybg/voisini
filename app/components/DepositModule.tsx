'use client';

import { useState } from 'react';

export default function DepositModule({ depositAmount }: { depositAmount: string }) {
  const [depositStatus, setDepositStatus] = useState('Beklemede');

  const updateDeposit = (status: string) => {
    setDepositStatus(status);
    const deposits = JSON.parse(localStorage.getItem('voisini_deposits') || '[]');
    deposits.push({
      id: Date.now(),
      amount: depositAmount,
      status,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem('voisini_deposits', JSON.stringify(deposits));
    alert(`Depozito durumu güncellendi: ${status}`);
  };

  if (!depositAmount) return null;

  return (
    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 shadow-sm mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-900">Depozito Güvence Sistemi</h3>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-lg">
          Durum: {depositStatus}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-4">
        Bu işlem için gereken güvence bedeli: <strong className="text-gray-900">{depositAmount}</strong>. Ürün iade edildiğinde depozito hesabınıza iade edilir.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateDeposit('Alındı')}
          className="bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-700 transition text-xs shadow-sm"
        >
          Depozitoyu Yatır (Alındı)
        </button>
        <button
          onClick={() => updateDeposit('İade edildi')}
          className="bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-xs"
        >
          Depozitoyu İade Et
        </button>
        <button
          onClick={() => updateDeposit('Kesinti yapıldı')}
          className="bg-red-50 border border-red-200 text-red-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-red-100 transition text-xs"
        >
          Hasar Kesintisi Yap
        </button>
      </div>
    </div>
  );
}