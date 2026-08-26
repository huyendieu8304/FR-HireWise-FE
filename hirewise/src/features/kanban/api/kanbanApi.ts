import { http } from '@/lib/apiClient';
import type { KanbanBoard, MoveApplicationStageResult } from '../types';

/** UC-22: toàn bộ Kanban board (mọi Stage đang active + Application của từng Stage) của 1 Job. */
export function getKanbanBoard(jobId: string): Promise<KanbanBoard> {
  return http.get<KanbanBoard>(`/jobs/${jobId}/kanban-board`);
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
