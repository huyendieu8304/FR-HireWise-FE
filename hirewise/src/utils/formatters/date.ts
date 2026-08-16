/**
 * Formatter cho ngày/giờ, dùng `dayjs` (nhẹ, ~2KB) thay vì viết tay parse Date.
 * Toàn bộ app format ngày/giờ PHẢI đi qua các hàm ở đây — không gọi
 * `date.toLocaleDateString()` rải rác để tránh lệch định dạng giữa các màn hình.
 */
import dayjs, { type ConfigType } from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(customParseFormat);
dayjs.locale('vi');

/** Format `DD/MM/YYYY` — chuẩn hiển thị ngày mặc định toàn hệ thống. */
export function formatDate(date: ConfigType): string {
  return dayjs(date).format('DD/MM/YYYY');
}

/** Format `HH:mm DD/MM/YYYY` — dùng khi cần cả giờ (lịch phỏng vấn, timestamp). */
export function formatDateTime(date: ConfigType): string {
  return dayjs(date).format('HH:mm DD/MM/YYYY');
}

/** Format chỉ giờ:phút — `HH:mm`. */
export function formatTime(date: ConfigType): string {
  return dayjs(date).format('HH:mm');
}

/**
 * Thời gian tương đối kiểu "5 phút trước", "2 ngày trước" — dùng cho hoạt
 * động gần đây (activity feed, comment, thay đổi trạng thái ứng viên).
 */
export function formatRelativeTime(date: ConfigType): string {
  return dayjs(date).fromNow();
}

/** true nếu ngày truyền vào là hôm nay — dùng để highlight trong lịch/bảng. */
export function isDateToday(date: ConfigType): boolean {
  return dayjs(date).isToday();
}

/**
 * Số ngày (làm tròn xuống) đã trôi qua kể từ `date` tới hiện tại — dùng để
 * tính "Time-in-Stage" cho SLA monitoring.
 */
export function daysSince(date: ConfigType): number {
  return dayjs().diff(dayjs(date), 'day');
}

/** Chuyển giá trị `<input type="date">` (YYYY-MM-DD) sang Date object an toàn. */
export function parseDateInputValue(value: string): Date | null {
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed.toDate() : null;
}

/** Chuyển Date/ISO string sang giá trị phù hợp cho `<input type="date">`. */
export function toDateInputValue(date: ConfigType): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/** Chuyển Date/ISO string sang giá trị phù hợp cho `<input type="datetime-local">`. */
export function toDateTimeInputValue(date: ConfigType): string {
  return dayjs(date).format('YYYY-MM-DDTHH:mm');
}
