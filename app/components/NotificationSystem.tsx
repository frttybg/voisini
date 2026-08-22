'use client';

export function sendSystemNotification(userId: string, title: string, message: string) {
  const notifications = JSON.parse(localStorage.getItem('voisini_notifications') || '[]');
  notifications.push({
    userId,
    title,
    message,
    read: false,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('voisini_notifications', JSON.stringify(notifications));
  console.log('Bildirim tetiklendi:', title);
}