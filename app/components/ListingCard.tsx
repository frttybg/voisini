'use client';

export default function ListingCard({ listing }: { listing: any }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition overflow-hidden">
      {/* Fotoğraf ve Tür Rozeti */}
      <div className="relative h-48 bg-gray-100">
        <img src={listing.photo} className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 bg-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm">
          {listing.typeLabel}
        </span>
      </div>
      
      {/* Detaylar */}
      <div className="p-4">
        <h3 className="font-bold text-sm text-gray-900 truncate">{listing.title}</h3>
        <p className="text-emerald-600 font-extrabold text-lg mt-1">{listing.price}</p>
        
        <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 font-semibold">
          <span>📍 {listing.distance}</span>
          <span>{listing.timeAgo}</span>
        </div>
      </div>

      {/* Kullanıcı Bilgisi */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold">
            {listing.user.charAt(0)}
          </div>
          <span className="text-[10px] font-bold">{listing.user}</span>
          <span className="text-[10px] text-amber-500">★ {listing.rating}</span>
        </div>
      </div>
    </div>
  );
}