'use client';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const router = useRouter();

  const changeLanguage = (lang: string) => {
    // Dil değiştiğinde HTML'in yönünü (RTL/LTR) güncelle
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    router.push(`/${lang}`);
  };

  return (
    <select onChange={(e) => changeLanguage(e.target.value)} className="bg-transparent text-xs font-bold border rounded-lg p-2">
      <option value="tr">🇹🇷 Türkçe</option>
      <option value="en">🇬🇧 English</option>
      <option value="de">🇩🇪 Deutsch</option>
      <option value="ar">🇸🇦 العربية</option>
      <option value="es">🇪🇸 Español</option>
    </select>
  );
}