'use type';
'use client';

import { useState } from 'react';

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('tr');

  const languages = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'es', label: 'Español' },
    { code: 'ar', label: 'العربية' },
  ];

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    
    // Arapça seçilirse sayfayı RTL (Sağdan sola) yap
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  return (
    <select
      value={currentLang}
      onChange={handleLangChange}
      aria-label="Dil Seçimi / Select Language"
      className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}