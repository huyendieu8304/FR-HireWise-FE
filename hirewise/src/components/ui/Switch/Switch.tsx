import { cn } from '@/utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Nhãn cho screen reader — bắt buộc vì Switch không có text hiển thị kèm. */
  label: string;
  size?: 'sm' | 'md';
}

const TRACK_SIZE = { sm: 'h-4 w-7', md: 'h-5 w-9' };
const THUMB_SIZE = { sm: 'size-3', md: 'size-4' };
const THUMB_TRANSLATE = { sm: 'translate-x-3', md: 'translate-x-4' };

/**
 * Toggle switch cho các trạng thái nhị phân (Active/Blocked, bật/tắt tùy
 * chọn...). Dùng `role="switch"` chuẩn a11y thay vì checkbox trá hình.
 *
 * @example <Switch checked={isActive} onChange={setIsActive} label="Trạng thái tài khoản" />
 */
export function Switch({ checked, onChange, disabled, label, size = 'md' }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors',
        TRACK_SIZE[size],
        checked ? 'bg-success-600' : 'bg-neutral-200',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'bg-neutral-0 shadow-elevation-1 inline-block transform rounded-full transition-transform',
          THUMB_SIZE[size],
          checked ? THUMB_TRANSLATE[size] : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
