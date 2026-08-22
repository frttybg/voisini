'use client';
export default function GirisPage() {
  const handleLogin = () => {
    const user = localStorage.getItem('voisini_user');
    if (user) {
      localStorage.setItem('voisini_session', 'true');
      window.location.href = '/profil';
    } else {
      alert('Kayıtlı kullanıcı bulunamadı.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border w-full max-w-md">
        <h2 className="text-2xl font-black mb-6">Hesabınıza Giriş Yapın</h2>
        <input className="w-full mb-4 p-3 border rounded-xl" type="email" placeholder="E-posta" />
        <input className="w-full mb-6 p-3 border rounded-xl" type="password" placeholder="Şifre" />
        <button onClick={handleLogin} className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold">Giriş Yap</button>
      </div>
    </div>
  );
}