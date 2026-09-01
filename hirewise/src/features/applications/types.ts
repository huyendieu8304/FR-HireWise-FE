/**
 * Kiểu dữ liệu cho UC-20 (Applicant Card chi tiết) và UC-29 (Từ chối ứng
 * viên kèm lý do chuẩn hóa) — khớp chính xác theo DTO thật của backend
 * (`HireWise-BE/.../dto/response/Application*.java`, `RejectionReason*.java`,
 * `RejectApplicationRequestDto.java`).
 */

import type { ApplicationStatus } from '@/features/kanban/types';
import type { StageType } from '@/features/pipelines/types';

/** Khớp `CandidateStatus.java` (LV-07). BLACKLISTED chỉ hiển thị cảnh báo, không tự động loại (BR-APPLY-03). */
export type CandidateStatus = 'ACTIVE' | 'BLACKLISTED';

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  ACTIVE: 'Bình thường',
  BLACKLISTED: 'Trong danh sách hạn chế',
};

/** Khớp `ApplicationFileRole.java` (LV-25). */
export type ApplicationFileRole = 'CV' | 'COVER_LETTER' | 'PORTFOLIO';

export const APPLICATION_FILE_ROLE_LABELS: Record<ApplicationFileRole, string> = {
  CV: 'CV',
  COVER_LETTER: 'Thư xin việc',
  PORTFOLIO: 'Portfolio',
};

/** Khớp `StageTransitionType.java` (LV-12). */
export type StageTransitionType = 'MANUAL' | 'SYSTEM' | 'ROLLBACK';

export const STAGE_TRANSITION_TYPE_LABELS: Record<StageTransitionType, string> = {
  MANUAL: 'Thao tác thủ công',
  SYSTEM: 'Hệ thống tự động',
  ROLLBACK: 'Khôi phục',
};

/** Khớp `RejectionCategory.java` (BR-REJ-01 catalog). */
export type RejectionCategory =
  | 'SKILL_GAP'
  | 'CULTURE_GAP'
  | 'SALARY_GAP'
  | 'DUPLICATE'
  | 'WITHDRAWN'
  | 'OTHER';

export const REJECTION_CATEGORY_LABELS: Record<RejectionCategory, string> = {
  SKILL_GAP: 'Chưa phù hợp kỹ năng',
  CULTURE_GAP: 'Chưa phù hợp văn hóa',
  SALARY_GAP: 'Chênh lệch mức lương',
  DUPLICATE: 'Hồ sơ trùng lặp',
  WITHDRAWN: 'Ứng viên tự rút hồ sơ',
  OTHER: 'Lý do khác',
};

/** Khớp `ApplicationFileResponseDto` — 1 file đính kèm (CV, thư xin việc...) của Application. */
export interface ApplicationFile {
  fileId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileRole: ApplicationFileRole;
  primary: boolean;
}

/** Khớp `ApplicationStageHistoryResponseDto` — 1 mốc trong dòng thời gian đổi Stage. */
export interface ApplicationStageHistoryEntry {
  fromStageId: number | null;
  fromStageName: string | null;
  toStageId: number;
  toStageName: string;
  transitionType: StageTransitionType;
  changedByName: string | null;
  changedAt: string;
}

/** Khớp `ApplicationRejectionResponseDto` — bản ghi từ chối (UC-29), null nếu chưa bị từ chối. */
export interface ApplicationRejection {
  reasonId: number;
  reasonCode: string;
  reasonLabel: string;
  customMessage: string | null;
  rejectedByName: string | null;
  rejectedAt: string;
}

/** Khớp `ApplicationDetailResponseDto` — toàn bộ Applicant Card (UC-20). */
export interface ApplicationDetail {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateStatus: CandidateStatus;
  jobId: string;
  jobTitle: string;
  currentStageId: number;
  currentStageName: string;
  currentStageType: StageType;
  currentStageTerminal: boolean;
  status: ApplicationStatus;
  appliedAt: string;
  lastStageChangedAt: string | null;
  files: ApplicationFile[];
  stageHistory: ApplicationStageHistoryEntry[];
  /** {@code null} trừ khi Application này đã bị từ chối (UC-29). */
  rejection: ApplicationRejection | null;
}

/** Khớp `RejectionReasonResponseDto` — 1 lựa chọn trong danh mục lý do từ chối chuẩn hóa (BR-REJ-01). */
export interface RejectionReason {
  id: number;
  code: string;
  label: string;
  category: RejectionCategory;
}

/** Khớp `RejectApplicationRequestDto` — payload gửi lên khi xác nhận từ chối (UC-29). */
export interface RejectApplicationRequest {
  reasonId: number;
  customMessage?: string;
}
