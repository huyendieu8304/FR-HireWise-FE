/**
 * Kiểu dữ liệu cho UC-27 (Master Scorecard Template + cấu hình theo Job/Stage)
 * và UC-28 (Nhập điểm theo Scorecard) — khớp chính xác theo DTO thật của
 * backend (`FR-HireWise-BE/.../dto/response/{Scorecard,JobStageScorecard}*.java`).
 * <p>
 * 2 khái niệm tách biệt (quyết định lại của team, xem `08-...` explain doc):
 * - {@link ScorecardTemplate} = Master Template do HR Admin quản lý, LUÔN
 *   dùng chung toàn hệ thống, chỉ là bản gốc để tham khảo/nhân bản, KHÔNG
 *   bao giờ dùng trực tiếp để chấm điểm.
 * - {@link JobStageScorecard} = Scorecard THẬT, gắn với đúng 1 cặp (Job,
 *   Stage loại phỏng vấn) — đây mới là cái evaluator thực sự chấm điểm vào.
 */

/** Dùng chung cho cả Master Template lẫn Job-Stage Scorecard — khớp `ScorecardStatus.java`. */
export type ScorecardStatus = 'ACTIVE' | 'ARCHIVED';

/** Khớp `ScorecardSubmissionStatus.java`. */
export type ScorecardSubmissionStatus = 'DRAFT' | 'SUBMITTED';

/** Khớp `ScorecardCriterionResponseDto`. */
export interface ScorecardCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  position: number;
  required: boolean;
}

/** HR Admin's Master Scorecard Template library — khớp `ScorecardTemplateResponseDto`. LUÔN dùng chung, không version. */
export interface ScorecardTemplate {
  id: string;
  name: string;
  status: ScorecardStatus;
  criteria: ScorecardCriterion[];
  createdAt: string;
  updatedAt: string;
}

/** 1 dòng trong bảng tiêu chí của form Tạo/Sửa Template — khớp `ScorecardCriterionInputDto`. */
export interface ScorecardCriterionInput {
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  required: boolean;
}

/** Khớp `SaveScorecardTemplateRequestDto`. */
export interface SaveScorecardTemplateRequest {
  name: string;
  criteria: ScorecardCriterionInput[];
}

/** Scorecard THẬT của 1 cặp (Job, Stage phỏng vấn) — khớp `JobStageScorecardResponseDto`. */
export interface JobStageScorecard {
  id: string;
  jobId: string;
  jobTitle: string;
  pipelineStageId: number;
  stageName: string;
  name: string;
  version: number;
  status: ScorecardStatus;
  /** `null` nếu tạo hoàn toàn từ đầu, không dựa trên Master Template nào. */
  sourceMasterTemplateId: string | null;
  sourceMasterTemplateName: string | null;
  criteria: ScorecardCriterion[];
  createdAt: string;
  updatedAt: string;
}

/** Khớp `SaveJobStageScorecardRequestDto`. */
export interface SaveJobStageScorecardRequest {
  name: string;
  sourceMasterTemplateId: string | null;
  criteria: ScorecardCriterionInput[];
}

/** 1 dòng chấm điểm trong form Scorecard Entry — khớp `ScorecardScoreResponseDto`. */
export interface ScorecardScoreRow {
  criterionId: string;
  criterionName: string;
  criterionDescription: string | null;
  weight: number;
  maxScore: number;
  required: boolean;
  /** `null` = chưa chấm điểm tiêu chí này. */
  score: number | null;
  comment: string | null;
}

/** Khớp `ScorecardSubmissionResponseDto` — toàn bộ form Scorecard Entry của 1 Interview. */
export interface ScorecardSubmission {
  submissionId: string;
  interviewId: string;
  /** Tên Stage phỏng vấn (vd "Technical Interview") — mỗi Stage có Scorecard riêng. */
  stageName: string | null;
  evaluatorId: number;
  evaluatorName: string;
  jobStageScorecardId: string;
  jobStageScorecardName: string;
  overallComment: string | null;
  /** `null` cho tới khi Submit. */
  weightedScore: number | null;
  status: ScorecardSubmissionStatus;
  submittedAt: string | null;
  /** Khác `null` = đã bị khoá (BR-SCORE-03, sau 24h) — chỉ đọc. */
  lockedAt: string | null;
  scores: ScorecardScoreRow[];
}

/** 1 tiêu chí trong request lưu tiến trình chấm điểm — khớp `ScorecardScoreInputDto`. */
export interface ScorecardScoreInput {
  criterionId: string;
  score: number | null;
  comment: string | null;
}

/** Khớp `SaveScorecardScoresRequestDto`. */
export interface SaveScorecardScoresRequest {
  overallComment: string;
  scores: ScorecardScoreInput[];
}

/** 1 dòng kết quả (đọc) của 1 evaluator cho 1 Interview — khớp `ScorecardSubmissionSummaryDto`. */
export interface ScorecardSubmissionSummary {
  submissionId: string;
  evaluatorId: number;
  evaluatorName: string;
  status: ScorecardSubmissionStatus;
  weightedScore: number | null;
  submittedAt: string | null;
  locked: boolean;
  /** Người đang xem danh sách này có chính là evaluator của dòng này không. */
  currentUser: boolean;
}

/** Khớp `InterviewScorecardGroupDto`. */
export interface InterviewScorecardGroup {
  interviewId: string;
  /** Tên Stage phỏng vấn — mỗi Stage loại INTERVIEW có Scorecard độc lập. */
  stageName: string | null;
  interviewDate: string;
  interviewTime: string;
  mode: 'ONLINE' | 'ONSITE';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  submissions: ScorecardSubmissionSummary[];
  /**
   * Người đang xem có phải Interviewer được phân công của buổi phỏng vấn
   * này, hoặc Hiring Manager của Job, hay không — chỉ để FE quyết định có
   * hiện nút "Chấm điểm" hay không, không phải ranh giới bảo mật (API chấm
   * điểm thật vẫn tự kiểm tra lại độc lập).
   */
  currentUserCanScore: boolean;
}

/** Khớp `ApplicationScorecardsResponseDto` — tab [Scorecard] trên Applicant Card. */
export interface ApplicationScorecards {
  /** `null` khi chưa có Scorecard nào ở trạng thái SUBMITTED. */
  averageWeightedScore: number | null;
  interviews: InterviewScorecardGroup[];
}

/** 1 dòng của checklist cấu hình Scorecard trên trang Phê duyệt Job — khớp `InterviewStageScorecardStatusDto`. */
export interface InterviewStageScorecardStatus {
  pipelineStageId: number;
  stageName: string;
  position: number;
  configured: boolean;
  /** `null` nếu `configured = false`. */
  jobStageScorecardId: string | null;
}
