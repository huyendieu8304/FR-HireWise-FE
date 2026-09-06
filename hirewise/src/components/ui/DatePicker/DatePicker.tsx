import { forwardRef, useId, useRef, type InputHTMLAttributes } from 'react';
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
 *
 * > **Vì sao icon lịch gọi `showPicker()` thay vì để click "xuyên qua"?**
 * > Bản cũ ẩn icon lịch gốc của trình duyệt bằng
 * > `::-webkit-calendar-picker-indicator { opacity: 0 }` rồi vẽ đè icon
 * > Phosphor lên đúng vị trí đó với `pointer-events-none`, kỳ vọng click sẽ
 * > "xuyên" xuống icon gốc (vô hình) bên dưới. Vị trí thật của
 * > `calendar-picker-indicator` do trình duyệt tự tính (phụ thuộc
 * > browser/zoom/DPI/hệ điều hành) nên không phải lúc nào cũng trùng khớp
 * > pixel với icon trang trí — khi lệch, click rơi vào phần text của input
 * > thay vì vào icon, và trình duyệt xử lý như một cú click để gõ tay từng
 * > phần ngày/giờ thay vì mở lịch. Đây chính là nguyên nhân lỗi "thỉnh
 * > thoảng không hiện ô chọn ngày, chỉ cho nhập text thủ công". Sửa bằng
 * > cách biến icon thành một `<button>` thật, gọi thẳng
 * > `inputEl.showPicker()` (API chuẩn, được hỗ trợ trên mọi trình duyệt hiện
 * > đại) — không còn phụ thuộc vào việc click có "trúng" đúng pixel hay
 * > không.
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
    const internalRef = useRef<HTMLInputElement>(null);

    // Gắn cùng lúc 2 ref vào input: `internalRef` để component tự gọi
    // `showPicker()`, và `ref` được forward ra ngoài (react-hook-form
    // `register()` cần ref thật để focus/validate). Không thể chỉ dùng 1
    // trong 2 vì `ref` truyền từ ngoài vào có thể là callback ref hoặc
    // object ref tùy nơi gọi.
    const setRefs = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const openPicker = () => {
      const el = internalRef.current;
      if (!el || el.disabled || el.readOnly) return;
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker();
          return;
        } catch {
          // Một số trình duyệt cũ/hoàn cảnh đặc biệt (vd gọi ngoài user
          // gesture) có thể chặn showPicker() — rơi xuống focus() để ít
          // nhất người dùng vẫn thao tác được bằng bàn phím.
        }
      }
      el.focus();
    };

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
            ref={setRefs}
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
          {/*
            Icon lịch giờ là 1 button thật, tự gọi showPicker() — xem giải
            thích "Vì sao..." ở JSDoc phía trên. `tabIndex={-1}` để không
            tạo thêm 1 điểm dừng Tab riêng (input đã tự có picker qua phím
            mũi tên/Enter theo chuẩn input date của trình duyệt).
          */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={openPicker}
            disabled={props.disabled}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 disabled:cursor-not-allowed disabled:hover:text-neutral-400"
          >
            <Icon className="size-4" />
          </button>
        </div>
      </FormFieldWrapper>
    );
  },
);

DatePicker.displayName = 'DatePicker';
