/**
 * Kiểu dữ liệu cho UC-16 (Public Job Board) và UC-17 (Điền form ứng tuyển) —
 * khớp chính xác theo DTO thật của backend
 * (`FR-HireWise-BE/.../dto/response/JobBoard*.java`, `SubmitApplication*.java`).
 */

/** Khớp `EmploymentType.java`. */
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
};

/** Khớp `JobBoardSummaryResponseDto` — 1 thẻ (card) trong danh sách UC-16. */
export interface JobSummary {
  id: string;
  title: string;
  departmentName: string | null;
  employmentType: EmploymentType | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
}

/** Khớp `JobBoardDetailResponseDto` — chi tiết JD đầy đủ (UC-16 bước 4). */
export interface JobDetail extends JobSummary {
  openings: number;
  applicationDeadline: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
}

/** Khớp `DepartmentResponseDto` (dùng lại nguyên vẹn cho bộ lọc UC-16 REF 2). */
export interface JobBoardDepartment {
  id: number;
  name: string;
}

/** Khớp `JobBoardFilterOptionsResponseDto`. */
export interface JobFilterOptions {
  departments: JobBoardDepartment[];
  employmentTypes: EmploymentType[];
}

/** Khớp `SubmitApplicationResponseDto` — `duplicate=true` ứng với AF-01/ME-23. */
export interface SubmitApplicationResponse {
  applicationId: string;
  duplicate: boolean;
}

import type { PipelineStage } from '@/features/pipelines/types';

// ---------------------------------------------------------------------------
// UC-14: Hiring Manager – danh sách Job cần xem xét phê duyệt
// ---------------------------------------------------------------------------

/**
 * Khớp `PendingApprovalJobSummaryResponseDto` — 1 dòng trong bảng UC-14.
 * Các cột hiển thị: Chức danh, Phòng ban, Số lượng chỉ tiêu, Người tạo, Ngày gửi, Trạng thái.
 */
export interface PendingApprovalJobSummary {
  /** UUID của job position — dùng để navigate sang UC-15 khi bấm vào dòng. */
  id: string;
  /** Chức danh tuyển dụng. */
  title: string;
  /** Tên phòng ban — null nếu job chưa gán phòng ban. */
  departmentName: string | null;
  /** Số lượng chỉ tiêu tuyển dụng. */
  openings: number;
  /** Loại hình lao động — dùng để hiển thị badge. */
  employmentType: EmploymentType | null;
  /** Tên đầy đủ của Recruiter đã tạo job. */
  createdByUserName: string | null;
  /**
   * Thời điểm submit lên để chờ duyệt (ISO 8601).
   * Map từ `JobPosition.updatedAt` phía backend.
   */
  submittedAt: string;
  /** Trạng thái hiện tại của job (PENDING_APPROVAL, APPROVED, REJECTED...). */
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'CLOSED';
  /** Tên quy trình tuyển dụng (Pipeline Template) nếu có. */
  pipelineTemplateName: string | null;
}

// ---------------------------------------------------------------------------
// UC-15: Hiring Manager – Phê duyệt / Từ chối yêu cầu tuyển dụng
// ---------------------------------------------------------------------------

/** Khớp `JobApprovalDetailResponseDto` — chi tiết đầy đủ khi Manager xem xét duyệt (UC-15). */
export interface JobApprovalDetail {
  id: string;
  title: string;
  departmentName: string | null;
  openings: number;
  employmentType: EmploymentType | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  applicationDeadline: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  createdByUserName: string | null;
  submittedAt: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'CLOSED';
  /** ID của Pipeline Template. */
  pipelineTemplateId: number | null;
  /** Tên của Pipeline Template. */
  pipelineTemplateName: string | null;
  /** Danh sách các bước trong quy trình tuyển dụng. */
  pipelineStages: PipelineStage[];
}

/** Body gửi lên khi từ chối Job (UC-15 AF-01). */
export interface RejectJobPayload {
  /** Lý do từ chối — tối thiểu 10 ký tự (BR-APR-02 / ME-21). */
  reason: string;
}

// ---------------------------------------------------------------------------
// "Vị trí tuyển dụng" — danh sách/chi tiết Job Position nội bộ (JOB_VIEW),
// điểm vào từ sidebar để xem JD + Kanban board của 1 Job (khác UC-14/15:
// không giới hạn theo trạng thái phê duyệt, không yêu cầu JOB_APPROVE).
// ---------------------------------------------------------------------------

/** Khớp `JobStatus.java`. */
export type JobPositionStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';

export const JOB_STATUS_LABELS: Record<JobPositionStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ phê duyệt',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Đã từ chối',
  PUBLISHED: 'Đang công bố',
  PAUSED: 'Tạm dừng',
  CLOSED: 'Đã đóng',
};

/** Khớp `JobSummaryResponseDto` — 1 dòng trong danh sách "Vị trí tuyển dụng". */
export interface InternalJobSummary {
  id: string;
  title: string;
  departmentId: number | null;
  departmentName: string | null;
  status: JobPositionStatus;
  employmentType: EmploymentType | null;
  openings: number;
  recruiterName: string | null;
  createdAt: string;
}

/** Khớp `JobDetailResponseDto` — tab "Mô tả chi tiết" khi mở 1 Job. */
export interface InternalJobDetail {
  id: string;
  title: string;
  departmentId: number | null;
  departmentName: string | null;
  location: string | null;
  employmentType: EmploymentType | null;
  salaryMin: number | null;
  salaryMax: number | null;
  openings: number;
  applicationDeadline: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  status: JobPositionStatus;
  recruiterName: string | null;
  hiringManagerName: string | null;
  pipelineTemplateId: number | null;
  pipelineTemplateName: string | null;
  createdAt: string;
  updatedAt: string;
}



