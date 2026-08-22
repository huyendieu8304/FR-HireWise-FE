import { Briefcase, Clock, UsersThree, WarningOctagon } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotification } from '@/hooks/useNotification';
import { KpiTile } from '../components/KpiTile';
import {
  PipelineVelocityChart,
  type VelocityDatum,
} from '../components/PipelineVelocityChart';
import { SourceRoiDonut, type SourceDatum } from '../components/SourceRoiDonut';
import { SlaAlertList, type SlaAlertDatum } from '../components/SlaAlertList';

// ⚠️ Dữ liệu tĩnh minh họa — trang "home mockup" sau đăng nhập. Sẽ thay bằng
// dữ liệu thật (TanStack Query + API báo cáo) khi triển khai feature Reports
// (UC-42/43) và có backend thật. Giữ nguyên shape để hoán đổi dễ dàng.
const VELOCITY_DATA: VelocityDatum[] = [
  { stageLabel: 'New', days: 1.2 },
  { stageLabel: 'Qualification', days: 2.8 },
  { stageLabel: 'Phỏng vấn chuyên môn', days: 8.1, isBottleneck: true },
  { stageLabel: 'Offer', days: 3.4 },
];

const SOURCE_DATA: SourceDatum[] = [
  { label: 'Website', percent: 42, colorVar: 'var(--color-primary-600)' },
  { label: 'LinkedIn', percent: 25, colorVar: 'var(--color-secondary-600)' },
  { label: 'Facebook', percent: 18, colorVar: 'var(--color-warning-500)' },
  { label: 'Referral', percent: 15, colorVar: 'var(--color-neutral-300)' },
];

const SLA_ALERTS: SlaAlertDatum[] = [
  {
    id: 'sla-1',
    candidateName: 'Trịnh Thảo',
    jobTitle: 'Senior Backend Engineer',
    stageName: 'Qualification',
    daysOverdue: 2,
  },
  {
    id: 'sla-2',
    candidateName: 'Ngô Hải Yến',
    jobTitle: 'Product Designer',
    stageName: 'Phỏng vấn chuyên môn',
    daysOverdue: 5,
  },
];

/**
 * Trang Home sau khi đăng nhập thành công — tổng quan pipeline tuyển dụng.
 * Toàn bộ số liệu là dữ liệu mẫu tĩnh (xem ghi chú ở trên); bố cục theo đúng
 * mockup đã duyệt (figma-mockups/UC-42-43 Dashboard).
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const notify = useNotification();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Chào buổi sáng, {user?.name ?? 'bạn'} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tổng quan pipeline tuyển dụng của bạn hôm nay.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Ứng viên đang xử lý"
          value="128"
          icon={<UsersThree className="size-4" />}
          iconVariant="primary"
          trend={{ direction: 'up', label: '+12% so với tuần trước' }}
        />
        <KpiTile
          label="Tin đang tuyển"
          value="9"
          icon={<Briefcase className="size-4" />}
          iconVariant="success"
          trend={{ direction: 'up', label: '3 chờ duyệt' }}
        />
        <KpiTile
          label="Vi phạm SLA"
          value={SLA_ALERTS.length}
          icon={<WarningOctagon className="size-4" />}
          iconVariant="danger"
          alert
          trend={{ direction: 'down', label: '+2 so với hôm qua' }}
        />
        <KpiTile
          label="Time-to-Hire TB"
          value={
            <>
              18 <span className="text-sm font-medium text-neutral-500">ngày</span>
            </>
          }
          icon={<Clock className="size-4" />}
          iconVariant="secondary"
          trend={{ direction: 'up', label: 'Nhanh hơn 3 ngày so với Q2' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-1 rounded-lg border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Pipeline Velocity</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Thời gian trung bình ứng viên nằm ở mỗi Stage
          </p>
          <PipelineVelocityChart data={VELOCITY_DATA} />
        </div>

        <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-1 rounded-lg border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Source ROI</h2>
          <p className="mb-3 text-xs text-neutral-500">Tỷ trọng ứng viên theo nguồn</p>
          <SourceRoiDonut data={SOURCE_DATA} total={128} />
        </div>
      </div>

      <div className="shadow-elevation-1 bg-neutral-0 rounded-lg border border-neutral-200 p-5">
        <div className="mb-3 flex items-center gap-2">
          <WarningOctagon className="text-danger-700 size-4" />
          <h2 className="text-danger-700 text-sm font-semibold">Ứng viên vi phạm SLA</h2>
        </div>
        <SlaAlertList
          items={SLA_ALERTS}
          onRemind={() => notify.info('Đã gửi nhắc nhở tới Recruiter phụ trách.')}
        />
      </div>
    </div>
  );
}
