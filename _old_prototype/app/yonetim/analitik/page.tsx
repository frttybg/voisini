'use client';

export default function AnalitikPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Platform Analitikleri</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-gray-500 text-xs">Günlük İşlem Hacmi</p>
          <h2 className="text-4xl font-black mt-2">₺ 12.450</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-gray-500 text-xs">Yeni Kayıt (Son 24s)</p>
          <h2 className="text-4xl font-black mt-2">42</h2>
        </div>
      </div>
    </div>
  );
}