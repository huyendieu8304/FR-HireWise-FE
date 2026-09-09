import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Clock, UsersThree, WarningOctagon } from '@phosphor-icons/react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotification } from '@/hooks/useNotification';
import { Skeleton } from '@/components/ui';
import { formatNumber } from '@/utils/formatters/number';
import {
  getPipelineVelocityReport,
  getSourceRoiReport,
} from '@/features/reports/api/reportsApi';
import { SOURCE_COLOR_VARS } from '@/features/reports/types';
import { KpiTile } from '../components/KpiTile';
import {
  PipelineVelocityChart,
  type VelocityDatum,
} from '../components/PipelineVelocityChart';
import { SourceRoiDonut, type SourceDatum } from '../components/SourceRoiDonut';
import { SlaAlertList, type SlaAlertDatum } from '../components/SlaAlertList';

// ⚠️ Danh sách vi phạm SLA vẫn là dữ liệu tĩnh — thuộc module M19 (UC-41),
// chưa có endpoint. Hai biểu đồ bên dưới đã chạy bằng dữ liệu thật (UC-42/43).
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

/** Số nguồn tối đa vẽ trên donut thu gọn của Dashboard — phần còn lại gộp vào "Khác". */
const TOP_SOURCES = 4;

/**
 * Trang Home sau khi đăng nhập — tổng quan pipeline tuyển dụng.
 *
 * Hai widget "Pipeline Velocity" và "Source ROI" đọc chính hai endpoint của
 * UC-42/UC-43, không truyền bộ lọc nào nên backend áp mặc định 90 ngày gần
 * nhất trong phạm vi Access Scope của người dùng (BR-RPT-02).
 *
 * Ở đây vẫn giữ 2 biểu đồ CSS gọn nhẹ chứ không dùng Recharts như trang Báo
 * cáo: đây là widget liếc qua, ai muốn đào sâu thì bấm "Xem báo cáo" sang trang
 * đầy đủ có bộ lọc, tooltip và export.
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const notify = useNotification();
  const canViewReports = user?.permissions.includes('REPORT_VIEW') ?? false;

  const { data: sourceRoi, isLoading: isSourceLoading } = useQuery({
    queryKey: ['reports', 'source-roi', 'dashboard'],
    queryFn: () => getSourceRoiReport({}),
    enabled: canViewReports,
  });

  const { data: velocity, isLoading: isVelocityLoading } = useQuery({
    queryKey: ['reports', 'pipeline-velocity', 'dashboard'],
    queryFn: () => getPipelineVelocityReport({}),
    enabled: canViewReports,
  });

  const velocityData: VelocityDatum[] = (velocity?.stages ?? [])
    .filter((stage) => stage.avgDays !== null)
    .map((stage) => ({
      stageLabel: stage.stageName,
      days: stage.avgDays as number,
      isBottleneck: stage.bottleneck,
    }));

  const sourceData = toDonutData(sourceRoi?.rows ?? []);
  const inProgress = (sourceRoi?.totalApplications ?? 0) - (sourceRoi?.totalHires ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Chào buổi sáng, {user?.name ?? 'bạn'} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tổng quan pipeline tuyển dụng của bạn trong 90 ngày gần nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Ứng viên đang xử lý"
          value={isSourceLoading ? '…' : formatNumber(Math.max(inProgress, 0))}
          icon={<UsersThree className="size-4" />}
          iconVariant="primary"
        />
        <KpiTile
          label="Ứng viên đã tiếp nhận"
          value={isSourceLoading ? '…' : formatNumber(sourceRoi?.totalApplications ?? 0)}
          icon={<Briefcase className="size-4" />}
          iconVariant="success"
        />
        <KpiTile
          label="Vi phạm SLA"
          value={SLA_ALERTS.length}
          icon={<WarningOctagon className="size-4" />}
          iconVariant="danger"
          alert
        />
        <KpiTile
          label="Time-to-Hire TB"
          value={
            isVelocityLoading ? (
              '…'
            ) : velocity?.avgTimeToHireDays == null ? (
              '—'
            ) : (
              <>
                {formatNumber(velocity.avgTimeToHireDays, { decimalPlaces: 1 })}{' '}
                <span className="text-sm font-medium text-neutral-500">ngày</span>
              </>
            )
          }
          icon={<Clock className="size-4" />}
          iconVariant="secondary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-1 rounded-lg border border-neutral-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Pipeline Velocity</h2>
              <p className="mb-3 text-xs text-neutral-500">
                Thời gian trung bình ứng viên nằm ở mỗi Stage
              </p>
            </div>
            {canViewReports && <ReportLink tab="pipeline-velocity" />}
          </div>
          {isVelocityLoading ? (
            <Skeleton className="h-40 rounded-md" />
          ) : velocityData.length === 0 ? (
            <WidgetEmpty canViewReports={canViewReports} />
          ) : (
            <PipelineVelocityChart data={velocityData} />
          )}
        </div>

        <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-1 rounded-lg border border-neutral-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Source ROI</h2>
              <p className="mb-3 text-xs text-neutral-500">Tỷ trọng ứng viên theo nguồn</p>
            </div>
            {canViewReports && <ReportLink tab="source-roi" />}
          </div>
          {isSourceLoading ? (
            <Skeleton className="h-40 rounded-md" />
          ) : sourceData.length === 0 ? (
            <WidgetEmpty canViewReports={canViewReports} />
          ) : (
            <SourceRoiDonut data={sourceData} total={sourceRoi?.totalApplications ?? 0} />
          )}
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

/**
 * Rút gọn danh sách nguồn xuống vừa một donut nhỏ.
 *
 * Chỉ giữ `TOP_SOURCES` nguồn lớn nhất và gộp phần còn lại thành "Khác" —
 * donut trên Dashboard rộng chưa tới 200px, vẽ mười lát cắt mỏng thì không đọc
 * được lát nào. Bảng đầy đủ nằm ở trang Báo cáo.
 */
function toDonutData(
  rows: { label: string; applicationShare: number | null; applicationCount: number }[],
): SourceDatum[] {
  const withShare = rows.filter((row) => row.applicationCount > 0 && row.applicationShare !== null);
  const top = withShare.slice(0, TOP_SOURCES);
  const rest = withShare.slice(TOP_SOURCES);

  const data: SourceDatum[] = top.map((row, index) => ({
    label: row.label,
    percent: row.applicationShare as number,
    colorVar: SOURCE_COLOR_VARS[index],
  }));

  if (rest.length > 0) {
    data.push({
      label: 'Khác',
      percent: rest.reduce((sum, row) => sum + (row.applicationShare as number), 0),
      colorVar: 'var(--color-neutral-300)',
    });
  }
  return data;
}

function ReportLink({ tab }: { tab: 'source-roi' | 'pipeline-velocity' }) {
  return (
    <Link
      to={tab === 'source-roi' ? ROUTES.REPORTS : `${ROUTES.REPORTS}?tab=${tab}`}
      className="text-primary-600 hover:text-primary-700 inline-flex shrink-0 items-center gap-1 text-xs font-medium"
    >
      Xem báo cáo
      <ArrowRight className="size-3" />
    </Link>
  );
}

function WidgetEmpty({ canViewReports }: { canViewReports: boolean }) {
  return (
    <p className="rounded-md bg-neutral-50 px-3 py-6 text-center text-sm text-neutral-500">
      {canViewReports
        ? 'Chưa đủ dữ liệu trong 90 ngày gần nhất.'
        : 'Bạn không có quyền xem báo cáo tuyển dụng.'}
    </p>
  );
}
