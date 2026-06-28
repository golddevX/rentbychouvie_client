import { formatVND } from '@/lib/money';

export function MoneyDisplay({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{formatVND(value)}</span>;
}
