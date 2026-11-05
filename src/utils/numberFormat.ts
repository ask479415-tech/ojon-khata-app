import { NumeralStyle } from '../types';

const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
  '.': '.',
};

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
  '।': '.',
  ',': '.',
};

/**
 * Converts any number or string with digits to Bengali numerals
 */
export function toBengaliNumerals(value: number | string): string {
  const str = typeof value === 'number' ? (Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '')) : value.toString();
  return str.replace(/[0-9.]/g, (char) => EN_TO_BN_DIGITS[char] ?? char);
}

/**
 * Parses user input containing either English or Bengali numerals into a JavaScript float
 */
export function parseBengaliOrEnglishNumber(input: string): number {
  if (!input || !input.trim()) return 0;
  
  // Replace Bengali digits with English digits
  let normalized = input.trim();
  for (const [bn, en] of Object.entries(BN_TO_EN_DIGITS)) {
    normalized = normalized.split(bn).join(en);
  }

  // Handle common fractional formats like 1 1/2 or 1/2
  if (normalized.includes('/')) {
    const parts = normalized.split(/\s+/);
    if (parts.length === 2 && parts[1].includes('/')) {
      const whole = parseFloat(parts[0]) || 0;
      const [num, den] = parts[1].split('/').map(Number);
      if (den && den !== 0) return whole + (num / den);
    } else if (parts.length === 1 && parts[0].includes('/')) {
      const [num, den] = parts[0].split('/').map(Number);
      if (den && den !== 0) return num / den;
    }
  }

  // Remove any non-numeric or non-decimal chars
  const sanitized = normalized.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a weight number according to selected numeral style
 */
export function formatWeight(
  val: number,
  style: NumeralStyle = 'bangla',
  precision = 2
): string {
  const cleanVal = Number.isInteger(val) ? val.toString() : val.toFixed(precision).replace(/\.?0+$/, '');
  if (style === 'bangla') {
    return toBengaliNumerals(cleanVal);
  }
  return cleanVal;
}

/**
 * Formats currency amount in BDT (৳)
 */
export function formatCurrency(
  val: number,
  style: NumeralStyle = 'bangla'
): string {
  const formatted = val.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  if (style === 'bangla') {
    return '৳ ' + toBengaliNumerals(formatted);
  }
  return '৳ ' + formatted;
}
