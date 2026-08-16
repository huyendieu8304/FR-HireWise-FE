import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { FormFieldWrapper } from '@/components/ui/FormField/FormField';
import { inputBaseClasses, inputStateClasses } from '@/components/ui/inputStyles';
import { cn } from '@/utils/cn';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  containerClassName?: string;
}

/**
 * Input text nền tảng — tương thích trực tiếp với `react-hook-form`:
 * `<TextInput label="Email" {...register('email')} error={errors.email?.message} />`
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      prefixIcon,
      suffixIcon,
      required,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

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
          {prefixIcon && (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400 [&_svg]:size-4">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={cn(
              inputBaseClasses,
              inputStateClasses(!!error),
              prefixIcon && 'pl-9',
              suffixIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {suffixIcon && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 [&_svg]:size-4">
              {suffixIcon}
            </span>
          )}
        </div>
      </FormFieldWrapper>
    );
  },
);

TextInput.displayName = 'TextInput';
