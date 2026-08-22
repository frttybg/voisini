'use client';

import { useState } from 'react';

export default function RatingSection({ targetUser }: { targetUser: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reviews = JSON.parse(localStorage.getItem('voisini_reviews') || '[]');
    const newReview = {
      id: Date.now(),
      targetUser,
      rating,
      comment,
      date: new Date().toLocaleDateString()
    };
    localStorage.setItem('voisini_reviews', JSON.stringify([newReview, ...reviews]));
    setSubmitted(true);
    alert('Değerlendirmeniz başarıyla kaydedildi!');
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Komşuyu Değerlendir</h3>
      {submitted ? (
        <p className="text-sm text-emerald-600 font-semibold">Değerlendirmeniz için teşekkürler!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Puanınız:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={`text-xl ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="İşlem ve iletişim süreci nasıldı? Yorum yazın..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
          ></textarea>

          <button
            type="submit"
            className="bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition text-xs"
          >
            Değerlendirmeyi Gönder
          </button>
        </form>
      )}
    </div>
  );
}