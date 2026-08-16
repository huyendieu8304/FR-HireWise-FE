import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper gộp className có điều kiện + tự loại bỏ xung đột Tailwind (vd:
 * `cn('px-4', 'px-2')` -> `'px-2'` thay vì giữ cả hai làm sai lệch style).
 * Dùng cho MỌI component thay vì nối chuỗi thủ công.
 *
 * Bắt buộc dùng khi component nhận `className` từ ngoài truyền vào, để giá
 * trị người dùng truyền có thể ghi đè đúng style mặc định của component.
 *
 * @example cn('px-4 py-2', isActive && 'bg-primary-600', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
