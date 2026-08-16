/**
 * Formatter cho dữ liệu dạng chữ: viết hoa, rút gọn, slugify, bỏ dấu tiếng Việt.
 */

/** Viết hoa chữ cái đầu tiên của chuỗi, giữ nguyên phần còn lại. */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Viết hoa chữ cái đầu MỖI từ — dùng cho tên riêng (vd tên ứng viên). */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => capitalize(word.toLowerCase()))
    .join(' ');
}

/**
 * Rút gọn chuỗi về tối đa `maxLength` ký tự, thêm "…" nếu bị cắt.
 * Không cắt giữa một từ khi có thể tránh được.
 *
 * @example truncate('Senior Backend Engineer (Java/Spring)', 20) // "Senior Backend…"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trimEnd()}…`;
}

/** Bỏ dấu tiếng Việt — dùng để tìm kiếm/so khớp không phân biệt dấu. */
export function removeVietnameseTones(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuyển chuỗi (kể cả tiếng Việt có dấu) thành slug URL-safe.
 *
 * @example slugify('Kỹ sư Backend (Java/Spring)') // "ky-su-backend-java-spring"
 */
export function slugify(text: string): string {
  return removeVietnameseTones(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Lấy chữ cái viết tắt (initials) từ họ tên — dùng cho avatar placeholder. */
export function getInitials(fullName: string, maxChars = 2): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const initials = parts.map((p) => p.charAt(0).toUpperCase());
  if (initials.length <= maxChars) return initials.join('');
  return [initials[0], initials[initials.length - 1]].join('');
}
