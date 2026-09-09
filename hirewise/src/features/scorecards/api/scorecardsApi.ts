import { http } from '@/lib/apiClient';
import type {
  ApplicationScorecards,
  JobStageScorecard,
  SaveJobStageScorecardRequest,
  SaveScorecardScoresRequest,
  SaveScorecardTemplateRequest,
  ScorecardSubmission,
  ScorecardTemplate,
} from '../types';

// ============================================================
// UC-27: Master Scorecard Template library (HR Admin, luôn dùng chung)
// ============================================================

/** UC-27 step 1: mọi Master Template, mới tạo trước. */
export function listScorecardTemplates(): Promise<ScorecardTemplate[]> {
  return http.get<ScorecardTemplate[]>('/scorecard-templates');
}

export function getScorecardTemplate(templateId: string): Promise<ScorecardTemplate> {
  return http.get<ScorecardTemplate>(`/scorecard-templates/${templateId}`);
}

/** UC-27 main flow: tạo Master Template mới. */
export function createScorecardTemplate(request: SaveScorecardTemplateRequest): Promise<ScorecardTemplate> {
  return http.post<ScorecardTemplate>('/scorecard-templates', request);
}

/** UC-27: sửa Master Template — luôn sửa tại chỗ (không versioning, xem `ScorecardTemplate` model). */
export function updateScorecardTemplate(
  templateId: string,
  request: SaveScorecardTemplateRequest,
): Promise<ScorecardTemplate> {
  return http.put<ScorecardTemplate>(`/scorecard-templates/${templateId}`, request);
}

// ============================================================
// UC-27 step 3 + UC-14/15 hard gate: Scorecard THẬT theo (Job, Stage)
// ============================================================

/**
 * Scorecard hiện hành của 1 Stage phỏng vấn trong 1 Job — 404 nếu Hiring
 * Manager CHƯA cấu hình cho cặp (Job, Stage) này.
 */
export function getJobStageScorecard(jobId: string, pipelineStageId: number): Promise<JobStageScorecard> {
  return http.get<JobStageScorecard>(`/jobs/${jobId}/pipeline-stages/${pipelineStageId}/scorecard`);
}

/**
 * Tạo mới (nếu Stage chưa có), sửa tại chỗ (nếu chưa từng chấm điểm), hoặc
 * tạo version mới (AF-01, nếu đã có Scorecard Submission tham chiếu) —
 * backend tự quyết định nhánh nào, FE luôn gọi cùng 1 endpoint này.
 */
export function saveJobStageScorecard(
  jobId: string,
  pipelineStageId: number,
  request: SaveJobStageScorecardRequest,
): Promise<JobStageScorecard> {
  return http.put<JobStageScorecard>(`/jobs/${jobId}/pipeline-stages/${pipelineStageId}/scorecard`, request);
}

// ============================================================
// UC-28: Scorecard entry (chấm điểm 1 Interview)
// ============================================================

/**
 * UC-28 step 1: form Scorecard của CHÍNH người gọi cho 1 Interview — backend
 * tự tạo 1 bản DRAFT rỗng nếu đây là lần đầu mở (không cần gọi API tạo riêng),
 * chấm theo đúng Scorecard của Stage mà Interview này được đặt lịch cho.
 */
export function getOrCreateScorecardForm(interviewId: string): Promise<ScorecardSubmission> {
  return http.get<ScorecardSubmission>(`/interviews/${interviewId}/scorecard`);
}

/**
 * Xem chi tiết BẤT KỲ submission nào (không chỉ của chính người gọi) —
 * dùng cho nút "Xem chi tiết" trên tab Scorecard, mở cho mọi người có
 * quyền `APPLICATION_VIEW` (Recruiter, HR Admin, Interviewer khác...),
 * không đòi hỏi phải là evaluator hợp lệ của buổi phỏng vấn đó — khác hẳn
 * `getOrCreateScorecardForm` (chỉ trả về/ tạo bản của CHÍNH người gọi).
 */
export function getScorecardSubmissionDetail(submissionId: string): Promise<ScorecardSubmission> {
  return http.get<ScorecardSubmission>(`/scorecard-submissions/${submissionId}`);
}

/** UC-28 step 2-3: lưu tiến trình chấm điểm (chưa Submit, chưa validate BR-SCORE-01). */
export function saveScorecardProgress(
  submissionId: string,
  request: SaveScorecardScoresRequest,
): Promise<ScorecardSubmission> {
  return http.put<ScorecardSubmission>(`/scorecard-submissions/${submissionId}`, request);
}

/** UC-28 step 4-5: chốt đánh giá — validate BR-SCORE-01, tính Weighted Score (BR-SCORE-02). */
export function submitScorecard(submissionId: string): Promise<ScorecardSubmission> {
  return http.post<ScorecardSubmission>(`/scorecard-submissions/${submissionId}/submit`);
}

/** BR-SCORE-03: HR Admin mở khoá 1 Scorecard đã bị khoá sau 24h (có audit log). */
export function unlockScorecard(submissionId: string): Promise<void> {
  return http.post<void>(`/scorecard-submissions/${submissionId}/unlock`);
}

/** UC-28 step 6: tab [Scorecard] trên Applicant Card — mọi Interview + kết quả từng evaluator. */
export function getApplicationScorecards(applicationId: string): Promise<ApplicationScorecards> {
  return http.get<ApplicationScorecards>(`/applications/${applicationId}/scorecards`);
}
