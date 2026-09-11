/**
 * UC-42 (Source ROI) và UC-43 (Pipeline Velocity) — module M20.
 *
 * Mirror nguyên các DTO backend trả về (`SourceRoiReportResponseDto`,
 * `PipelineVelocityReportResponseDto`). Mọi tỷ lệ đều có thể là `null` khi mẫu
 * số bằng 0: backend cố tình **không** trả 0 cho trường hợp đó, vì "chưa đo
 * được" và "bằng không" dẫn tới hai quyết định trái ngược nhau. UI phải hiển
 * thị dấu "—" chứ không phải "0%".
 */

/** Bộ lọc chung của cả 2 tab (BR-RPT-03). */
export interface ReportFilterValue {
  /** ISO date `yyyy-MM-dd`; rỗng = để backend lấy mặc định 90 ngày gần nhất. */
  fromDate: string;
  toDate: string;
  /** Rỗng = tất cả phòng ban trong access scope của người dùng. */
  departmentId: string;
  /** Rỗng = tất cả Job trong access scope. */
  jobPositionId: string;
}

export interface SourceRoiRow {
  /** `utm_source` thô; rỗng = truy cập trực tiếp. */
  sourceKey: string;
  channelCode: string | null;
  /** Nhãn hiển thị: tên kênh, "Truy cập trực tiếp", hoặc chính `sourceKey`. */
  label: string;
  applicationCount: number;
  applicationShare: number | null;
  hireCount: number;
  hireRate: number | null;
  /** Trọn đời, KHÔNG lọc theo khoảng thời gian — xem ghi chú trên bảng. */
  shareCount: number;
  /** Trọn đời, KHÔNG lọc theo khoảng thời gian. */
  clickCount: number;
  clickToApplyRate: number | null;
  avgDaysToHire: number | null;
  direct: boolean;
  /** Không kênh nào đang khai `utm_source` này nữa (HR Admin đã sửa ở UC-19). */
  unknown: boolean;
}

export interface SourceRoiReport {
  rows: SourceRoiRow[];
  totalApplications: number;
  totalHires: number;
  overallHireRate: number | null;
  /** Chỉ tính nguồn có tối thiểu 5 ứng viên — xem `MIN_SAMPLE_NOTE`. */
  bestSourceLabel: string | null;
  bestSourceHireRate: number | null;
  avgDaysToHire: number | null;
  fromDate: string;
  toDate: string;
}

export interface StageVelocityRow {
  stageCode: string;
  stageName: string;
  stageType: string;
  stageOrder: number;
  avgDays: number | null;
  medianDays: number | null;
  p90Days: number | null;
  /** Số lượt chuyển đã hoàn tất — cỡ mẫu đứng sau avg/median/p90. */
  completedCount: number;
  slaDays: number | null;
  slaBreached: boolean;
  bottleneck: boolean;
  enteredCount: number;
  advancedCount: number;
  rejectedCount: number;
  passThroughRate: number | null;
  /** Hồ sơ đang nằm trong Stage này ngay lúc này. */
  waitingCount: number;
  maxWaitingDays: number | null;
}

export interface PipelineVelocityReport {
  stages: StageVelocityRow[];
  avgTimeToHireDays: number | null;
  hiredCount: number;
  bottleneckStageCode: string | null;
  fromDate: string;
  toDate: string;
}

/** ME-37 — dùng nguyên văn cho empty state của cả 2 tab. */
export const ME_37 = 'Không có dữ liệu phù hợp với bộ lọc đã chọn';

/**
 * Ngưỡng cỡ mẫu backend áp cho mọi xếp hạng (`ReportService.MIN_SAMPLE_SIZE`).
 * Giữ nguyên con số ở đây chỉ để giải thích cho người đọc dashboard, không
 * dùng vào tính toán nào ở FE.
 */
export const MIN_SAMPLE_NOTE = 'Chỉ xét các mục có tối thiểu 5 lượt để tránh nhiễu do mẫu quá nhỏ';

/** Bảng màu donut UC-42 — cùng bộ token với `SourceRoiDonut` trên Dashboard. */
export const SOURCE_COLOR_VARS = [
  'var(--color-primary-600)',
  'var(--color-secondary-600)',
  'var(--color-warning-500)',
  'var(--color-info-500)',
  'var(--color-success-600)',
  'var(--color-neutral-300)',
] as const;
