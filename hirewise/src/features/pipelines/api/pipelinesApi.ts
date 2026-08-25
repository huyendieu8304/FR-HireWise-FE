import { http } from '@/lib/apiClient';
import type { PipelineStage, PipelineTemplate, StageType } from '../types';

/** UC-04 step 1: danh sách Pipeline Template để HR Admin chọn. */
export function listPipelineTemplates(): Promise<PipelineTemplate[]> {
  return http.get<PipelineTemplate[]>('/pipeline-templates');
}

export interface CreatePipelineTemplatePayload {
  name: string;
  /** `undefined` = dùng chung toàn hệ thống (UC-04 AF-01). */
  departmentId?: number;
}

/** UC-04 AF-01: tạo Pipeline Template mới (luôn ở trạng thái DRAFT, chưa có Stage nào). */
export function createPipelineTemplate(
  payload: CreatePipelineTemplatePayload,
): Promise<PipelineTemplate> {
  return http.post<PipelineTemplate>('/pipeline-templates', payload);
}

/** UC-04 step 1: danh sách Stage của 1 Template, theo đúng thứ tự position. */
export function listPipelineStages(templateId: number): Promise<PipelineStage[]> {
  return http.get<PipelineStage[]>(`/pipeline-templates/${templateId}/stages`);
}

export interface CreatePipelineStagePayload {
  name: string;
  code: string;
  stageType: StageType;
  terminal: boolean;
  slaHours?: number | null;
}

/**
 * UC-04 main flow bước 2-5: thêm 1 Stage mới vào cuối Template (BR-PIPE-04
 * — backend tự tính `position`, không gửi từ FE).
 */
export function createPipelineStage(
  templateId: number,
  payload: CreatePipelineStagePayload,
): Promise<PipelineStage> {
  return http.post<PipelineStage>(`/pipeline-templates/${templateId}/stages`, payload);
}

/**
 * UC-05 main flow: sắp xếp lại toàn bộ Stage của 1 Template trong 1 lần
 * gọi. `stageIds` PHẢI là đúng và đủ toàn bộ id Stage hiện có của Template
 * (không thiếu, không thừa, không lặp), theo đúng thứ tự mới mong muốn —
 * backend tự gán `position = index + 1` cho từng phần tử (BR-PIPE-04).
 */
export function reorderPipelineStages(
  templateId: number,
  stageIds: number[],
): Promise<PipelineStage[]> {
  return http.patch<PipelineStage[]>(`/pipeline-templates/${templateId}/stages/reorder`, {
    stageIds,
  });
}

/**
 * UC-06 main flow: xóa (soft-delete, `is_active=false`) 1 Stage. Backend
 * tự chặn (409) nếu đang có Application tham chiếu (BR-PIPE-03/EX-01) và
 * tự re-index lại `position` các Stage còn lại (BR-PIPE-04).
 */
export function deletePipelineStage(templateId: number, stageId: number): Promise<void> {
  return http.delete<void>(`/pipeline-templates/${templateId}/stages/${stageId}`);
}
