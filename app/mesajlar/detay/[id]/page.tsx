'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { sender: 'other', text: 'Merhaba, ürün hâlâ mevcut mu?', time: '10:40' },
    { sender: 'me', text: 'Evet, henüz satılmadı.', time: '10:45' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { sender: 'me', text: input, time: 'Şimdi' }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white">
      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.sender === 'me' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Alanı */}
      <div className="p-4 border-t flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          className="flex-1 p-3 border rounded-xl text-sm" 
          placeholder="Mesaj yaz..." 
        />
        <button onClick={sendMessage} className="bg-emerald-600 text-white px-6 rounded-xl font-bold">Gönder</button>
      </div>
    </div>
  );
}