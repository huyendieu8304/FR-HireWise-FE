import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { FormFieldWrapper } from '@/components/ui/FormField/FormField';
import { inputBaseClasses, inputStateClasses } from '@/components/ui/inputStyles';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

/**
 * Dropdown chọn 1 giá trị từ danh sách, dựa trên `<select>` gốc (đảm bảo a11y
 * và hành vi mobile tốt nhất "miễn phí") — tương thích trực tiếp với RHF:
 * `<Select label="Phòng ban" options={departments} {...register('departmentId')} />`
 *
 * Khi cần multi-select / tìm kiếm trong danh sách dài, thay bằng một
 * combobox riêng (không nằm trong phạm vi bộ input nền tảng này).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      options,
      placeholder,
      required,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <FormFieldWrapper
        id={selectId}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        className={containerClassName}
      >
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            defaultValue={props.defaultValue ?? ''}
            className={cn(
              inputBaseClasses,
              inputStateClasses(!!error),
              'appearance-none pr-9',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <CaretDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </FormFieldWrapper>
    );
  },
);

Select.displayName = 'Select';
