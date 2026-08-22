'use client';

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-center h-16 px-2 shadow-lg">
      <a href="/" className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[10px] font-semibold">
        <span className="text-lg">🏠</span>
        <span>Ana Sayfa</span>
      </a>
      <a href="/yakinimdakiler" className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[10px] font-semibold">
        <span className="text-lg">📍</span>
        <span>Keşfet</span>
      </a>
      <a href="/ilan-ekle" className="flex flex-col items-center text-white bg-emerald-600 hover:bg-emerald-700 w-12 h-12 rounded-full justify-center shadow-md -mt-4">
        <span className="text-xl font-bold">+</span>
      </a>
      <a href="/mesajlar" className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[10px] font-semibold">
        <span className="text-lg">💬</span>
        <span>Mesajlar</span>
      </a>
      <a href="/profil" className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[10px] font-semibold">
        <span className="text-lg">👤</span>
        <span>Profil</span>
      </a>
    </div>
  );
}