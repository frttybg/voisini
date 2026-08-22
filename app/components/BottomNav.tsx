'use client';

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-4 py-2 flex justify-between items-center shadow-lg">
      <a href="/" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
        <span className="text-xs font-semibold mt-1">Ana Sayfa</span>
      </a>
      <a href="/yakinimdakiler" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
        <span className="text-xs font-semibold mt-1">Keşfet</span>
      </a>
      <a href="/ilan-ekle" className="flex flex-col items-center bg-emerald-600 text-white p-3 rounded-full shadow-md -mt-6 hover:bg-emerald-700 transition">
        <span className="text-xl font-bold">+</span>
      </a>
      <a href="/mesajlar" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
        <span className="text-xs font-semibold mt-1">Mesajlar</span>
      </a>
      <a href="/profil" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
        <span className="text-xs font-semibold mt-1">Profil</span>
      </a>
    </div>
  );
}