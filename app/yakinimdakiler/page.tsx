'use client';
import { useState } from 'react';
import ListingCard from '../components/ListingCard';

export default function ListelemePage() {
  const [sortBy, setSortBy] = useState('yeni'); // Sıralama: yakın, yeni, fiyat_dusuk, fiyat_yuksek

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filtre ve Sıralama Çubuğu */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <select className="p-3 border rounded-xl text-sm" onChange={(e) => setSortBy(e.target.value)}>
          <option value="yeni">En Yeni</option>
          <option value="yakin">En Yakın</option>
          <option value="fiyat_dusuk">Fiyat: Düşükten Yükseğe</option>
          <option value="fiyat_yuksek">Fiyat: Yüksekten Düşüğe</option>
        </select>
        {/* Kategori, Fiyat, Mesafe filtreleri buraya eklenecek */}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* İlanlar buraya mapping ile gelecek */}
      </div>
    </div>
  );
}