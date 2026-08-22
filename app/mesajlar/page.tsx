'use client';
import { useState, useEffect } from 'react';

export default function MesajlarPage() {
  const [conversations, setConversations] = useState([
    { id: 1, otherUser: 'Ahmet Y.', lastMessage: 'Merhaba, ürün hâlâ mevcut mu?', time: '10:42', unread: true },
    { id: 2, otherUser: 'Zeynep K.', lastMessage: 'Kiralama için uygun musunuz?', time: 'Dün', unread: false }
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Mesajlarım</h1>
      <div className="space-y-4">
        {conversations.map((conv) => (
          <a href={`/mesajlar/detay/${conv.id}`} key={conv.id} className="block bg-white p-4 rounded-2xl border shadow-sm hover:border-emerald-200 transition">
            <div className="flex justify-between items-start">
              <span className={`font-bold ${conv.unread ? 'text-emerald-600' : 'text-gray-900'}`}>{conv.otherUser}</span>
              <span className="text-[10px] text-gray-400">{conv.time}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 truncate">{conv.lastMessage}</p>
          </a>
        ))}
      </div>
    </div>
  );
}