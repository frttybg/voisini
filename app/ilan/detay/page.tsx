'use client';

import { useState } from 'react';

export default function IlanDetayPage() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Mesajı localStorage'a kaydedelim
    const existingMessages = JSON.parse(localStorage.getItem('user_messages') || '[]');
    const newMessage = {
      id: Date.now(),
      item: 'Temel Trekking Bisikleti',
      text: message,
      sender: 'Sen',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    localStorage.setItem('user_messages', JSON.stringify([newMessage, ...existingMessages]));

    setSent(true);
    setMessage('');
    setTimeout(() => {
      window.location.href = '/mesajlar';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
          <a href="/yakinimdakiler" className="text-sm font-medium text-emerald-600 hover:underline">&larr; İlanlara Dön</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          {/* Görsel Alanı */}
          <div className="h-72 sm:h-96 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-lg relative">
            <span>Ürün Detay Görseli</span>
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
              Satılık
            </span>
          </div>

          {/* Başlık ve Fiyat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Spor</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">Temel Trekking Bisikleti</h1>
              <p className="text-sm text-gray-500 mt-1">Sana 2.3 km uzaklıkta • 2 saat önce eklendi</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-400 block">Fiyat / Değer</span>
              <span className="text-3xl font-black text-emerald-600">3.500 TL</span>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Açıklama</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Az kullanılmış, tertemiz trekking bisikleti. Tüm bakımları yeni yapıldı, vites geçişleri kusursuz. Model yükselteceğim için satıyorum. Komşumuza şimdiden hayırlı olsun!
            </p>
          </div>

          {/* Satıcı Bilgisi ve İletişim */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                A
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Ahmet Y.</h4>
                <p className="text-xs text-gray-500">★★★★★ 4.8 (12 İşlem) • Doğrulanmış Komşu</p>
              </div>
            </div>
          </div>

          {/* Mesaj Gönderme Formu */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Satıcıyla İletişime Geç</h3>
            {sent ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-semibold text-center">
                Mesajınız başarıyla gönderildi! Mesajlar sayfasına yönlendiriliyorsunuz...
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Merhaba, ürün hâlâ mevcut mu? Ne zaman teslim alabilirim?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                ></textarea>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm w-full sm:w-auto"
                >
                  Satıcıya Mesaj Gönder
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}