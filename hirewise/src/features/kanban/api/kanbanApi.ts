import { http } from '@/lib/apiClient';
import type { AiScreeningBatchResult, KanbanBoard, MoveApplicationStageResult } from '../types';

/** UC-22: toàn bộ Kanban board (mọi Stage đang active + Application của từng Stage) của 1 Job. */
export function getKanbanBoard(jobId: string): Promise<KanbanBoard> {
  return http.get<KanbanBoard>(`/jobs/${jobId}/kanban-board`);
}

/**
 * UC-21 "Quét cả cột": enqueue AI Screening Run cho MỌI Application đang ở
 * 1 Stage (cột) cụ thể của Job — nút thủ công trên cột "Mới", thay vì bấm
 * "Phân tích lại" (`runAiScreening`) từng ứng viên một. 202 Accepted — các
 * run PENDING được xử lý bất đồng bộ, không chờ kết quả ở request này.
 */
export function runAiScreeningBatch(jobId: string, stageId: number): Promise<AiScreeningBatchResult> {
  return http.post<AiScreeningBatchResult>(`/jobs/${jobId}/kanban-board/stages/${stageId}/ai-screening/run-batch`);
}

/**
 * UC-23: kéo-thả 1 Application sang Stage khác. Backend tự ghi lịch sử
 * (`application_stage_history`, BR-KANBAN-01) và tính lại `status` theo
 * loại Stage đích (BR-KANBAN-03) — FE chỉ cần gửi `targetStageId`.
 */
export function moveApplicationStage(
  applicationId: string,
  targetStageId: number,
): Promise<MoveApplicationStageResult> {
  return http.patch<MoveApplicationStageResult>(`/applications/${applicationId}/stage`, {
    targetStageId,
  });
}
