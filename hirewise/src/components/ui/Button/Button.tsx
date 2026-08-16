import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

// SHAPE CONSISTENCY LOCK: buttons luôn dùng rounded-md (radius-md), không trộn pill/sharp.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-200 disabled:text-neutral-400',
  secondary:
    'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 disabled:bg-neutral-200 disabled:text-neutral-400',
  outline:
    'border border-neutral-300 bg-neutral-0 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 disabled:text-neutral-300',
  ghost:
    'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 disabled:text-neutral-300',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 disabled:bg-neutral-200 disabled:text-neutral-400',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

/**
 * Button nền tảng — mọi nút bấm trong app nên dùng component này thay vì
 * `<button>` thô, để đảm bảo trạng thái loading/disabled, contrast a11y và
 * tactile feedback (active:scale) nhất quán toàn hệ thống.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading && <CircleNotch className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
