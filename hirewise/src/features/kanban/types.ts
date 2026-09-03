/**
 * Kiểu dữ liệu cho UC-22 (Kanban Board) và UC-23 (Chuyển trạng thái Stage
 * ứng viên) — khớp chính xác theo DTO thật của backend
 * (`HireWise-BE/.../dto/response/Kanban*.java`, `MoveApplicationStage*.java`).
 */

import type { StageType } from '@/features/pipelines/types';

/** Khớp `ApplicationStatus.java`. HIRED/REFUSED/WITHDRAWN là trạng thái kết thúc. */
export type ApplicationStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'OFFER_SENT'
  | 'HIRED'
  | 'REFUSED'
  | 'WITHDRAWN';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  OFFER_SENT: 'Đã gửi Offer',
  HIRED: 'Trúng tuyển',
  REFUSED: 'Đã từ chối',
  WITHDRAWN: 'Ứng viên rút hồ sơ',
};

/** Khớp `ApplicationCardResponseDto` — 1 thẻ (card) trên Kanban board (UC-22). */
export interface ApplicationCard {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  status: ApplicationStatus;
  appliedAt: string;
  lastStageChangedAt: string | null;
}

/** Khớp `KanbanStageColumnResponseDto` — 1 cột (Stage) trên Kanban board. */
export interface KanbanStageColumn {
  stageId: number;
  name: string;
  code: string;
  stageType: StageType;
  position: number;
  terminal: boolean;
  applications: ApplicationCard[];
}

/** Khớp `KanbanBoardResponseDto` — toàn bộ Kanban board của 1 Job (UC-22). */
export interface KanbanBoard {
  jobId: string;
  jobTitle: string;
  columns: KanbanStageColumn[];
}

/** Khớp `MoveApplicationStageResponseDto` — kết quả sau khi kéo-thả (UC-23). */
export interface MoveApplicationStageResult {
  applicationId: string;
  fromStageId: number;
  toStageId: number;
  status: ApplicationStatus;
  lastStageChangedAt: string;
}

// ============================================================
// UC-24: Schedule Interview types
// ============================================================

export type InterviewMode = 'ONLINE' | 'ONSITE';

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface InterviewParticipantDto {
  interviewerId: number;
  interviewerName: string;
  interviewerEmail: string;
}

export interface InterviewerOption {
  id: number;
  fullName: string;
  email: string;
  departmentName: string | null;
}

export interface ScheduleInterviewRequest {
  targetStageId: number;
  interviewerIds: number[];
  interviewDate: string; // YYYY-MM-DD
  interviewTime: string; // HH:mm
  mode: InterviewMode;
  locationOrLink?: string;
  notes?: string;
}

export interface ScheduleInterviewResponse {
  interviewId: string;
  applicationId: string;
  interviewDate: string;
  interviewTime: string;
  mode: InterviewMode;
  locationOrLink: string | null;
  status: InterviewStatus;
  notes: string | null;
  participants: InterviewParticipantDto[];
  fromStageId: number;
  toStageId: number;
  applicationStatus: ApplicationStatus;
  lastStageChangedAt: string;
}

export interface InterviewCalendarItem {
  interviewId: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewDate: string; // YYYY-MM-DD
  interviewTime: string; // HH:mm
  mode: InterviewMode;
  locationOrLink: string | null;
  status: InterviewStatus;
  interviewerNames: string[];
}


