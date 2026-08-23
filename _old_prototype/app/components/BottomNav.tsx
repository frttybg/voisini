'use client';

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around z-50 shadow-lg">
      <a href="/" className="flex flex-col items-center text-[10px] font-bold text-gray-900">🏠 Ana Sayfa</a>
      <a href="/yakinimdakiler" className="flex flex-col items-center text-[10px] font-bold text-gray-400">🔍 Keşfet</a>
      <a href="/ilan-ekle" className="bg-emerald-600 text-white rounded-full p-3 -mt-6 shadow-lg flex items-center justify-center">➕</a>
      <a href="/mesajlar" className="flex flex-col items-center text-[10px] font-bold text-gray-400">💬 Mesajlar</a>
      <a href="/profil" className="flex flex-col items-center text-[10px] font-bold text-gray-400">👤 Profil</a>
    </div>
  );
}