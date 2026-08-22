// İki koordinat arası yaklaşık mesafe (Haversine formülü)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

// Yaklaşık konum maskeleme (Gizlilik için)
export const getFuzzyLocation = (address: string) => {
    return address.split(',').slice(-2).join(', '); // Sadece Şehir/Bölge bilgisini tut
};