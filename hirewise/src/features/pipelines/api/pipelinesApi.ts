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
 * — backend tự tính `position`, không gửi từ FE). Sắp xếp lại thứ tự
 * (UC-05) và xóa Stage (UC-06) là 2 use case khác, chưa có API.
 */
export function createPipelineStage(
  templateId: number,
  payload: CreatePipelineStagePayload,
): Promise<PipelineStage> {
  return http.post<PipelineStage>(`/pipeline-templates/${templateId}/stages`, payload);
}
