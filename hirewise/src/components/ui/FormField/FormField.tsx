import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FormFieldWrapperProps {
  id: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper bố cục CHUẨN cho mọi input trong hệ thống: Label PHÍA TRÊN input,
 * error text PHÍA DƯỚI, helper text luôn có mặt trong markup (dù rỗng) để
 * layout không bị nhảy khi lỗi xuất hiện/biến mất (xem SKILL.md mục 4.6).
 *
 * Đây là component NỘI BỘ — dùng trong TextInput/NumberInput/Select/DatePicker,
 * không import trực tiếp ở feature code.
 */
export function FormFieldWrapper({
  id,
  label,
  required,
  helperText,
  error,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-danger-600 text-xs">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
