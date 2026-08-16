import { useId, useState, type ReactNode } from 'react';
import { FormFieldWrapper } from '@/components/ui/FormField/FormField';
import { inputBaseClasses, inputStateClasses } from '@/components/ui/inputStyles';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/formatters/number';

export interface NumberInputProps {
  id?: string;
  name?: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Giá trị số thuần (không phải chuỗi đã format) — điều khiển từ ngoài (controlled). */
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  /** Số chữ số thập phân tối đa khi hiển thị (mặc định 0 — số nguyên như VNĐ). */
  decimalPlaces?: number;
  /** Ký hiệu tiền tệ hiển thị dạng addon bên trái, vd "₫", "$". Không ảnh hưởng giá trị lưu. */
  currencySymbol?: ReactNode;
  containerClassName?: string;
}

/**
 * Input số có tự động format phân cách hàng nghìn (và hỗ trợ hiển thị như
 * tiền tệ qua `currencySymbol`). Component này CONTROLLED — dùng với
 * react-hook-form qua `Controller`, không dùng trực tiếp `register()`:
 *
 * @example
 * <Controller
 *   name="salary"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <NumberInput
 *       label="Mức lương"
 *       currencySymbol="₫"
 *       value={field.value}
 *       onChange={field.onChange}
 *       onBlur={field.onBlur}
 *       error={fieldState.error?.message}
 *     />
 *   )}
 * />
 */
export function NumberInput({
  id,
  name,
  label,
  helperText,
  error,
  required,
  disabled,
  placeholder,
  value,
  onChange,
  onBlur,
  min,
  max,
  decimalPlaces = 0,
  currencySymbol,
  containerClassName,
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  // Khi đang gõ, hiển thị chuỗi thô (raw) để không "nhảy" con trỏ; khi blur
  // mới format lại đẹp với dấu phân cách hàng nghìn.
  const [rawText, setRawText] = useState<string | null>(null);
  const displayValue =
    rawText !== null
      ? rawText
      : value === null
        ? ''
        : formatNumber(value, { decimalPlaces });

  function parseInput(text: string): number | null {
    const cleaned = text.replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    setRawText(text);
    onChange(parseInput(text));
  }

  function handleBlur() {
    let next = value;
    if (next !== null) {
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
      if (next !== value) onChange(next);
    }
    setRawText(null);
    onBlur?.();
  }

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
        {currencySymbol && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-400">
            {currencySymbol}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          className={cn(
            inputBaseClasses,
            inputStateClasses(!!error),
            'text-right',
            currencySymbol && 'pl-8',
          )}
        />
      </div>
    </FormFieldWrapper>
  );
}
