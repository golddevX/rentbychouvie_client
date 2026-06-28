import { SecurityDepositOption } from '@/types';

export type RentalDepositPolicy = {
  cashAmount: number;
  label: string;
  requiresCccd: boolean;
  selectedOption: SecurityDepositOption;
  allowedOptions: SecurityDepositOption[];
};

export function getRentalDepositPolicy(
  rentalPrice: number,
  rules = {
    noDepositMaximumRental: 300000,
    middleTierMaximumRental: 1000000,
    middleTierCashDeposit: 500000,
    highTierCashDeposit: 1000000,
    highTierCashWithDocument: 500000,
  },
  selectedOption?: SecurityDepositOption,
): RentalDepositPolicy {
  const rental = Math.max(Number(rentalPrice || 0), 0);

  if (rental <= rules.noDepositMaximumRental) {
    return {
      cashAmount: 0,
      label: 'Không cần cọc',
      requiresCccd: false,
      selectedOption: 'none',
      allowedOptions: ['none'],
    };
  }

  if (rental < rules.middleTierMaximumRental) {
    const allowedOptions: SecurityDepositOption[] = ['cash_500k', 'cccd'];
    const resolvedOption = selectedOption && allowedOptions.includes(selectedOption)
      ? selectedOption
      : 'cash_500k';
    return {
      cashAmount: resolvedOption === 'cash_500k' ? rules.middleTierCashDeposit : 0,
      label: `Cọc ${rules.middleTierCashDeposit.toLocaleString('vi-VN')}đ hoặc giữ giấy tờ tùy thân`,
      requiresCccd: resolvedOption === 'cccd',
      selectedOption: resolvedOption,
      allowedOptions,
    };
  }

  const allowedOptions: SecurityDepositOption[] = ['cash_1m', 'cash_500k_and_cccd'];
  const resolvedOption = selectedOption && allowedOptions.includes(selectedOption)
    ? selectedOption
    : 'cash_1m';
  return {
    cashAmount: resolvedOption === 'cash_1m'
      ? rules.highTierCashDeposit
      : rules.highTierCashWithDocument,
    label: `Cọc ${rules.highTierCashDeposit.toLocaleString('vi-VN')}đ hoặc ${rules.highTierCashWithDocument.toLocaleString('vi-VN')}đ kèm giấy tờ tùy thân`,
    requiresCccd: resolvedOption === 'cash_500k_and_cccd',
    selectedOption: resolvedOption,
    allowedOptions,
  };
}
