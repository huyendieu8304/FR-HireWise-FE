import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * Khối loading dạng skeleton — dùng để mô phỏng hình dạng layout thật trong
 * lúc chờ dữ liệu (thay vì spinner tròn chung chung). Ghép nhiều `<Skeleton>`
 * lại để dựng "bộ xương" của Kanban card, table row, v.v.
 *
 * @example <Skeleton className="h-4 w-32" /> // 1 dòng text
 * @example <Skeleton className="h-24 w-full rounded-lg" /> // 1 card
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-neutral-200', className)}
    />
  );
}
