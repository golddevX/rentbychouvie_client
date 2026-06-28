export function formatVND(value?: number | null) {
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(Math.max(Number(value || 0), 0))} ₫`;
}
