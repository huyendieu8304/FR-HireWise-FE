/**
 * Formatter cho số và tiền tệ. Dựa trên `Intl.NumberFormat` (chuẩn built-in
 * của trình duyệt) thay vì tự viết logic chèn dấu phẩy — chính xác hơn với
 * mọi locale và không cần thêm dependency.
 */

const VI_LOCALE = 'vi-VN';

export interface FormatNumberOptions {
  /** Số chữ số thập phân cố định. Mặc định 0 (số nguyên). */
  decimalPlaces?: number;
  locale?: string;
}

/**
 * Format số với dấu phân cách hàng nghìn theo chuẩn Việt Nam (dùng dấu chấm).
 *
 * @example formatNumber(1234567) // "1.234.567"
 * @example formatNumber(1234.5, { decimalPlaces: 2 }) // "1.234,50"
 */
export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const { decimalPlaces = 0, locale = VI_LOCALE } = options;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

export type CurrencyCode = 'VND' | 'USD';

/**
 * Format số thành chuỗi tiền tệ đầy đủ ký hiệu.
 *
 * @example formatCurrency(15000000, 'VND') // "15.000.000 ₫"
 * @example formatCurrency(1500.5, 'USD') // "$1,500.50"
 */
export function formatCurrency(value: number, currency: CurrencyCode = 'VND'): string {
  const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'VND' ? 0 : 2,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(value);
}

/**
 * Format số rút gọn cho hiển thị nhanh (dashboard, badge).
 *
 * @example formatCompactNumber(1500) // "1,5 N" (locale vi-VN compact)
 * @example formatCompactNumber(2400000) // "2,4 Tr"
 */
export function formatCompactNumber(value: number, locale: string = VI_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format số thành phần trăm. @example formatPercent(0.856) // "85,6%" */
export function formatPercent(value: number, decimalPlaces = 0): string {
  return new Intl.NumberFormat(VI_LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}
