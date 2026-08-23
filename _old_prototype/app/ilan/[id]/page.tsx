'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IlanDetayPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Mock veri - API entegrasyonunda veritabanından çekilecek
  const listing = {
    id: params.id,
    title: 'Nespresso Kahve Makinesi',
    description: 'Sadece 3 ay kullanıldı, çok temiz. Tüm parçaları orijinal kutusunda duruyor. Taşınacağım için satıyorum.',
    price: '1.250 TL',
    type: 'Vendre (Sat)',
    category: 'Elektronik',
    date: '22 Ağustos 2026',
    distance: 'Sana 1.2 km uzaklıkta',
    owner: 'Ahmet Y.',
    rating: '4.8',
    images: ['/coffee1.jpg', '/coffee2.jpg']
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Sol: Büyük Fotoğraf Galerisi */}
        <div className="space-y-4">
          <div className="h-80 bg-gray-200 rounded-3xl overflow-hidden">
            <img src={listing.images[0]} className="w-full h-full object-cover" alt={listing.title} />
          </div>
          <div className="flex gap-2">
            {listing.images.map((img, i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden cursor-pointer">
                <img src={img} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: İlan Detayları */}
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{listing.type}</span>
          <h1 className="text-3xl font-black mt-3 mb-2">{listing.title}</h1>
          <p className="text-2xl font-extrabold text-gray-900 mb-4">{listing.price}</p>
          
          <div className="text-sm text-gray-600 space-y-2 mb-6">
            <p>📍 {listing.distance}</p>
            <p>📁 Kategori: {listing.category}</p>
            <p>📅 İlan Tarihi: {listing.date}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl mb-6">
            <h4 className="font-bold mb-2">Açıklama</h4>
            <p className="text-sm text-gray-700">{listing.description}</p>
          </div>

          {/* Satıcı Bilgisi & CTA */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                {listing.owner.charAt(0)}
              </div>
              <div>
                <p className="font-bold">{listing.owner}</p>
                <p className="text-xs text-amber-500">★ {listing.rating} Puan</p>
              </div>
            </div>
            
            <button 
              onClick={() => router.push(`/mesajlar/${listing.id}`)}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition"
            >
              Satıcıyla İletişime Geç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}