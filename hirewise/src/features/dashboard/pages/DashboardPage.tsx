import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

/**
 * Placeholder Dashboard — thay bằng widget thật (Pipeline Velocity, Source
 * ROI, SLA alerts...) khi triển khai feature Reports. Giữ nguyên bố cục
 * `page-container` + `gap-(--spacing-section)` làm chuẩn cho các trang khác.
 */
export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tổng quan pipeline tuyển dụng — khu vực này sẽ chứa các widget báo cáo khi
          feature Reports được triển khai.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-3 rounded-lg border border-neutral-200 p-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
