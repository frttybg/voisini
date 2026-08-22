'use client';

export default function KayitPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a href="/" className="text-3xl font-black text-emerald-600 tracking-tight">voisini<span className="text-gray-900">.com</span></a>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">Aramıza Katılın</h2>
        <p className="text-sm text-gray-600 mt-1">Komşular arası paylaşım ağına hemen dahil olun.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-3xl sm:px-10 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Ad Soyad / Kullanıcı Adı</label>
            <input
              type="text"
              placeholder="Ahmet Yılmaz"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">E-posta Adresi</label>
            <input
              type="email"
              placeholder="ornek@mail.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Şifre</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => alert('Kayıt oluşturuldu! (MVP simülasyonu)')}
            className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm"
          >
            Kayıt Ol
          </button>

          <p className="text-center text-sm text-gray-600">
            Zaten hesabınız var mı?{' '}
            <a href="/giris" className="font-semibold text-emerald-600 hover:underline">Giriş Yapın</a>
          </p>
        </div>
      </div>
    </div>
  );
}