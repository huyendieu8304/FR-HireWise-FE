/**
 * Class dùng chung cho mọi control dạng input (TextInput, NumberInput, Select,
 * DatePicker) để đảm bảo SHAPE CONSISTENCY LOCK — cùng một radius (rounded-md),
 * cùng chiều cao, cùng hành vi focus/error trên toàn hệ thống.
 */
export const inputBaseClasses =
  'h-10 w-full rounded-md border bg-neutral-0 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400';

export const inputStateClasses = (hasError: boolean) =>
  hasError
    ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none';
