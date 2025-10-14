import { currencyService } from '@/services/currencyService';

/**
 * Format an amount in its original currency with KES conversion
 * @param amount - The amount to format
 * @param currency - The original currency code (USD, EUR, GBP, KES)
 * @param amountInKES - Optional pre-calculated KES amount
 * @returns Formatted string showing original amount and KES conversion
 */
export const formatAmountWithKES = (
  amount: number,
  currency: string,
  amountInKES?: number
): { primary: string; kes: string } => {
  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const primary = formatCurrency(amount, currency);
  
  // If KES amount is provided, use it; otherwise calculate it
  let kesAmount = amountInKES;
  if (!kesAmount && currency !== 'KES') {
    // Use fixed exchange rates: 1 USD = 127 KES, 1 EUR = 147 KES, 1 GBP = 170 KES
    const rates: Record<string, number> = {
      USD: 127,
      EUR: 147,
      GBP: 170,
    };
    kesAmount = amount * (rates[currency] || 127);
  }

  const kes = currency === 'KES' 
    ? '' 
    : `≈ ${formatCurrency(kesAmount || 0, 'KES')}`;

  return { primary, kes };
};

/**
 * Get KES conversion text for display
 * @param amount - The amount in original currency
 * @param currency - The original currency code
 * @param amountInKES - Optional pre-calculated KES amount
 */
export const getKESConversion = async (
  amount: number,
  currency: string,
  amountInKES?: number
): Promise<string> => {
  if (currency === 'KES') return '';
  
  const kesValue = amountInKES || await currencyService.convertAmount(amount, currency, 'KES');
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kesValue);
};
