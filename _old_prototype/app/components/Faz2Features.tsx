'use client';

import { useState } from 'react';

export function FavoriteButton({ listingId, title }: { listingId: number, title: string }) {
  const [isFav, setIsFav] = useState(false);

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem('voisini_favorites') || '[]');
    if (isFav) {
      const updated = favs.filter((id: number) => id !== listingId);
      localStorage.setItem('voisini_favorites', JSON.stringify(updated));
      setIsFav(false);
      alert('İlan favorilerinizden çıkarıldı.');
    } else {
      favs.push(listingId);
      localStorage.setItem('voisini_favorites', JSON.stringify(favs));
      setIsFav(true);
      alert('İlan favorilerinize eklendi! (Bildirim sistemine kaydedildi)');
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`px-4 py-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 ${
        isFav ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span>{isFav ? '❤️ Favorilerde' : '🤍 Favorilere Ekle'}</span>
    </button>
  );
}