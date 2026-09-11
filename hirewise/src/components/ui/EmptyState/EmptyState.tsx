import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  /** Icon Phosphor, thường dùng `weight="thin"` cho nhẹ mắt. */
  icon?: ReactNode;
  /** Dòng chính — nói rõ *không có gì*, đừng nói "lỗi". */
  title: string;
  /** Dòng phụ gợi ý người dùng làm gì tiếp (nới bộ lọc, đổi khoảng thời gian...). */
  hint?: string;
  /** Nút hành động tuỳ chọn (ví dụ "Xoá bộ lọc"). */
  action?: ReactNode;
  className?: string;
}

/**
 * Trạng thái "không có dữ liệu" dùng chung — trích ra từ đoạn markup vốn được
 * copy lặp lại ở `JobListPage`, `ApprovalListPage`...
 *
 * Dùng cho UC-42/UC-43 (ME-37: "Không có dữ liệu phù hợp với bộ lọc đã chọn").
 * Lưu ý đây **không phải** error state: backend trả 200 với danh sách rỗng, nên
 * màn hình phải trông như "chưa có gì" chứ không phải "hỏng rồi".
 */
export function EmptyState({ icon, title, hint, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}
      role="status"
    >
      {icon}
      <div>
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
