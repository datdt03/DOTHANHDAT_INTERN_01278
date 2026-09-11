/**
 * Format Utilities
 */

export function formatVND(amount) {
  if (typeof amount !== 'number') return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '';
  return phone.slice(0, 4) + '***' + phone.slice(-3);
}

export function formatRelativeTime(minutesAgo) {
  if (minutesAgo < 1) return 'Vừa xong';
  if (minutesAgo < 60) return `${minutesAgo} phút trước`;
  const hours = Math.floor(minutesAgo / 60);
  return `${hours} giờ trước`;
}
