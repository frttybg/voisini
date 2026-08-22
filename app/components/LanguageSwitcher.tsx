'use client';

import { useState } from 'react';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('TR');

  const languages = [
    { code: 'TR', name: 'Türkçe' },
    { code: 'EN', name: 'English' },
    { code: 'DE', name: 'Deutsch' },
    { code: 'FR', name: 'Français' },
    { code: 'ES', name: 'Español' },
    { code: 'AR', name: 'العربية (RTL)' },
  ];

  const handleSelect = (lang: string) => {
    setCurrentLang(lang);
    setIsOpen(false);
    // RTL desteği için Arapça seçilirse html dir özniteliğini değiştirebiliriz
    if (lang === 'AR') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    alert(`Dil ${lang} olarak değiştirildi!`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-2 rounded-xl hover:bg-gray-200 transition"
      >
        <span>🌐 {currentLang}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}