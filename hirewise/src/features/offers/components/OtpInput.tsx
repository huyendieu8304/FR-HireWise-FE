import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';

export interface OtpInputProps {
  /** Giá trị hiện tại, độ dài 0..6, chỉ chứa chữ số. */
  value: string;
  onChange: (value: string) => void;
  /** Gọi khi người dùng nhập đủ 6 số — dùng để tự submit. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const OTP_LENGTH = 6;

/**
 * UC-38 Screen Description ô số 1: ô nhập OTP 6 số, tự động chuyển focus
 * giữa các ô.
 *
 * Viết tay thay vì dùng `<TextInput>` vì đây là 6 ô rời có hành vi focus
 * riêng, không phải một trường nhập liệu thông thường trong form.
 */
export function OtpInput({ value, onChange, onComplete, disabled, error }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  function emit(next: string) {
    onChange(next);
    if (next.length === OTP_LENGTH) {
      onComplete?.(next);
    }
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    if (!digit) return;

    const chars = value.padEnd(OTP_LENGTH, ' ').split('');
    chars[index] = digit;
    emit(chars.join('').trimEnd());

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const chars = value.padEnd(OTP_LENGTH, ' ').split('');
      // Ô đang trống thì Backspace lùi về ô trước và xóa ở đó — hành vi
      // người dùng mong đợi khi gõ nhầm rồi sửa.
      const target = chars[index]?.trim() ? index : Math.max(index - 1, 0);
      chars[target] = ' ';
      emit(chars.join('').trimEnd());
      inputRefs.current[target]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    // Ứng viên thường copy cả mã từ email, không gõ từng số.
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    emit(pasted);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Chữ số thứ ${index + 1} của mã xác thực`}
            disabled={disabled}
            value={digit.trim()}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={[
              'size-12 rounded-md border text-center text-lg font-semibold transition-colors outline-none',
              'focus:ring-2 focus:ring-primary-500/20 disabled:bg-neutral-100 disabled:text-neutral-400',
              error
                ? 'border-danger-400 text-danger-700 focus:border-danger-500'
                : 'border-neutral-300 text-neutral-900 focus:border-primary-500',
            ].join(' ')}
          />
        ))}
      </div>
      {error && <p className="text-center text-sm text-danger-600">{error}</p>}
    </div>
  );
}
