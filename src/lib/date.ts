export function rentalDaysBetween(pickupDate?: string, returnDate?: string) {
  if (!pickupDate || !returnDate) return 0;
  const start = new Date(`${pickupDate.slice(0, 10)}T00:00:00`);
  const end = new Date(`${returnDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function toIsoDateTime(value?: string, time = '00:00') {
  if (!value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T${time}:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function formatDateLabel(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getNextDay(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
