/**
 * Kiểu dữ liệu cho UC-04 (Pipeline Template & Stage Configuration) — khớp
 * chính xác theo DTO thật của backend (`FR-HireWise-BE/.../dto/`). Xem
 * `hirewise/docs/GUIDE.md` mục "Gọi API mới" nếu cần đối chiếu quy ước.
 */

/** Khớp `PipelineTemplateStatus.java`. DRAFT -> ACTIVE (kích hoạt) là điều kiện tiên quyết của UC-13 — xem `activatePipelineTemplate`. */
export type PipelineTemplateStatus = 'DRAFT' | 'ACTIVE';

/** Khớp `StageType.java` (LV-06). */
export type StageType =
  | 'INTAKE'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'TERMINAL_SUCCESS'
  | 'TERMINAL_REJECTED';

export const ALL_STAGE_TYPES: StageType[] = [
  'INTAKE',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'TERMINAL_SUCCESS',
  'TERMINAL_REJECTED',
];

export const STAGE_TYPE_LABELS: Record<StageType, string> = {
  INTAKE: 'Tiếp nhận hồ sơ',
  SCREENING: 'Sàng lọc / Đánh giá',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Chốt offer',
  TERMINAL_SUCCESS: 'Kết thúc — Thành công',
  TERMINAL_REJECTED: 'Kết thúc — Bị loại',
};

/** Khớp `PipelineTemplateResponseDto`. */
export interface PipelineTemplate {
  id: number;
  name: string;
  departmentId: number | null;
  departmentName: string | null;
  status: PipelineTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

/** Khớp `PipelineStageResponseDto`. */
export interface PipelineStage {
  id: number;
  pipelineTemplateId: number;
  name: string;
  code: string;
  stageType: StageType;
  position: number;
  terminal: boolean;
  slaHours: number | null;
  active: boolean;
  /** UC-06: số Application đang có current_stage_id trỏ tới Stage này (BR-PIPE-03) —
   * >0 nghĩa là chặn xóa, không cần gọi API riêng để biết trước khi mở hộp thoại xóa. */
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}
