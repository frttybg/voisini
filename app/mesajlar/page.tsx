'use client';

import { useState, useEffect } from 'react';

export default function MesajlarPage() {
  const [messages, setMessages] = useState([
    { id: 1, item: 'Nespresso Kahve Makinesi', text: 'Merhaba, günlük kiralama için uygun mu?', sender: 'Zeynep K.', time: 'Dün' }
  ]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_messages') || '[]');
    if (saved.length > 0) {
      setMessages((prev) => [...saved, ...prev]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/" className="text-sm font-medium text-emerald-600 hover:underline">&larr; Ana Sayfaya Dön</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Mesajlarım</h1>

        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-gray-100">
          {messages.map((msg, index) => (
            <div key={msg.id || index} className="p-5 hover:bg-gray-50 transition flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                  {msg.sender.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">{msg.sender}</h4>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">{msg.item}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{msg.text}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{msg.time}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}