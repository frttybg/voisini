'use client';

import { useState } from 'react';

export default function MesajlarPage() {
  const [activeChat, setActiveChat] = useState(1);

  const chats = [
    { id: 1, name: 'Ahmet Yılmaz', item: 'Trekking Bisikleti', lastMessage: 'Merhaba, ürün hâlâ mevcut mu?', time: '14:32', unread: true },
    { id: 2, name: 'Zeynep Kaya', item: 'Nespresso Kahve Makinesi', lastMessage: 'Yarın akşam alabilirim.', time: 'Dün', unread: false },
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

      {/* Ana Mesaj Alanı */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm w-full grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          
          {/* Sol: Sohbet Listesi */}
          <div className="border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-lg">
              Mesajlar
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-grow">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`p-4 cursor-pointer transition hover:bg-gray-50 ${
                    activeChat === chat.id ? 'bg-emerald-50/60' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{chat.name}</span>
                    <span className="text-xs text-gray-400">{chat.time}</span>
                  </div>
                  <p className="text-xs font-medium text-emerald-600 mb-1">{chat.item}</p>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Aktif Sohbet Penceresi */}
          <div className="col-span-2 flex flex-col justify-between bg-gray-50/30">
            {/* Sohbet Başlığı */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Ahmet Yılmaz</h3>
                <p className="text-xs text-gray-500">İlan: Trekking Bisikleti</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">Aktif Komşu</span>
            </div>

            {/* Mesaj Akışı */}
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-3.5 max-w-xs text-sm shadow-sm">
                  <p className="text-gray-800">Merhaba, ürün hâlâ mevcut mu?</p>
                  <span className="text-[10px] text-gray-400 mt-1 block text-right">14:32</span>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-emerald-600 text-white rounded-2xl p-3.5 max-w-xs text-sm shadow-sm">
                  <p>Evet, mevcut! Yakınlardaysanız gelip görebilirsiniz.</p>
                  <span className="text-[10px] text-emerald-200 mt-1 block text-right">14:35</span>
                </div>
              </div>
            </div>

            {/* Mesaj Yazma Alanı */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
              <input
                type="text"
                placeholder="Mesajınızı yazın..."
                className="flex-grow px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
              <button
                type="button"
                onClick={() => alert('Mesaj gönderildi! (MVP simülasyonu)')}
                className="bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-emerald-700 transition text-sm"
              >
                Gönder
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}