import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { CalendarBlank, Clock } from '@phosphor-icons/react';
import { FormFieldWrapper } from '@/components/ui/FormField/FormField';
import { inputBaseClasses, inputStateClasses } from '@/components/ui/inputStyles';
import { cn } from '@/utils/cn';

export interface DatePickerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  helperText?: string;
  error?: string;
  /** 'date' cho chỉ ngày (vd hạn nộp CV), 'datetime-local' cho ngày+giờ (vd lịch phỏng vấn). */
  mode?: 'date' | 'datetime-local';
  containerClassName?: string;
}

/**
 * Input chọn ngày / ngày-giờ chuẩn, dựa trên `<input type="date|datetime-local">`
 * gốc của trình duyệt — nhẹ, không phụ thuộc thư viện ngoài, hỗ trợ bàn phím
 * và mobile tốt. Giá trị trả về theo chuẩn ISO (`YYYY-MM-DD` /
 * `YYYY-MM-DDTHH:mm`) — dùng `utils/formatters/date.ts` để đổi sang hiển thị
 * `DD/MM/YYYY` ở nơi khác trong UI.
 *
 * Tương thích trực tiếp với react-hook-form:
 * `<DatePicker label="Hạn nộp" mode="date" {...register('deadline')} />`
 *
 * Cần lịch dạng popover tùy biến sâu hơn (chọn khoảng ngày, disable ngày cụ
 * thể...) thì thay bằng một component chuyên biệt — nằm ngoài phạm vi bộ
 * input nền tảng này.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      mode = 'date',
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const Icon = mode === 'datetime-local' ? Clock : CalendarBlank;

    return (
      <FormFieldWrapper
        id={inputId}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        className={containerClassName}
      >
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={mode}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={cn(
              inputBaseClasses,
              inputStateClasses(!!error),
              'pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0',
              className,
            )}
            {...props}
          />
          <Icon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </FormFieldWrapper>
    );
  },
);

DatePicker.displayName = 'DatePicker';
