import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChartPieSlice, Gauge } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';
import { ReportFilterBar } from '../components/ReportFilterBar';
import { SourceRoiTab } from '../components/SourceRoiTab';
import { PipelineVelocityTab } from '../components/PipelineVelocityTab';
import type { ReportFilterValue } from '../types';

type ReportTab = 'source-roi' | 'pipeline-velocity';

const TABS: { key: ReportTab; label: string; icon: typeof ChartPieSlice }[] = [
  { key: 'source-roi', label: 'Hiệu quả nguồn tuyển dụng', icon: ChartPieSlice },
  { key: 'pipeline-velocity', label: 'Tốc độ pipeline', icon: Gauge },
];

const EMPTY_FILTER: ReportFilterValue = {
  fromDate: '',
  toDate: '',
  departmentId: '',
  jobPositionId: '',
};

/**
 * Menu [Báo cáo] — vỏ chứa 2 tab của module M20:
 * - UC-42 "Source Effectiveness": tỷ trọng ứng viên theo nguồn + Export Excel.
 * - UC-43 "Pipeline Velocity": thời gian trung bình ở mỗi Stage.
 *
 * Tab hiện tại nằm trong query param `?tab=` (giống `JobDetailPage`) chứ không
 * phải state cục bộ: báo cáo hay được gửi link cho nhau, và người nhận cần mở
 * ra đúng tab người gửi đang xem.
 *
 * Bộ lọc (BR-RPT-03) dùng chung cho cả 2 tab và cố ý **không** reset khi
 * chuyển tab — hai dashboard trả lời hai nửa của cùng một câu hỏi, đổi tab mà
 * mất luôn khoảng thời gian vừa chọn thì không so sánh được gì.
 */
export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<ReportFilterValue>(EMPTY_FILTER);

  const tabParam = searchParams.get('tab');
  const activeTab: ReportTab = tabParam === 'pipeline-velocity' ? 'pipeline-velocity' : 'source-roi';

  function handleTabChange(tab: ReportTab) {
    setSearchParams(tab === 'source-roi' ? {} : { tab });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">Báo cáo tuyển dụng</h1>
        <p className="text-sm text-neutral-500">
          Số liệu tính trực tiếp từ dữ liệu ứng tuyển và lịch sử chuyển Stage, trong phạm vi
          phòng ban và Job bạn được phép xem.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <Icon className={cn('size-4', isActive ? 'text-primary-600' : 'text-neutral-400')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <ReportFilterBar value={filter} onChange={setFilter} />

      {activeTab === 'source-roi' ? (
        <SourceRoiTab filter={filter} />
      ) : (
        <PipelineVelocityTab filter={filter} />
      )}
    </div>
  );
}
