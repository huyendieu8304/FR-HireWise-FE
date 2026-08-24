import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type { EmailTemplate, PipelineStageOption } from '../types';

export interface ListEmailTemplatesParams {
  page?: number;
  size?: number;
}

/** UC-09: GET /api/admin/email-templates (yeu cau quyen EMAIL_TEMPLATE_MANAGE). */
export function listEmailTemplates(
  params: ListEmailTemplatesParams = {},
): Promise<PagedResponse<EmailTemplate>> {
  return http.get<PagedResponse<EmailTemplate>>('/admin/email-templates', {
    params: { page: params.page ?? 0, size: params.size ?? 100 },
  });
}

/** UC-09: GET /api/admin/email-templates/{id} */
export function getEmailTemplate(id: number): Promise<EmailTemplate> {
  return http.get<EmailTemplate>(`/admin/email-templates/${id}`);
}

export interface EmailTemplatePayload {
  name: string;
  code: string;
  pipelineStageId?: number | null;
  subjectTemplate: string;
  bodyTemplate: string;
}

/** UC-09 normal flow: POST /api/admin/email-templates */
export function createEmailTemplate(payload: EmailTemplatePayload): Promise<EmailTemplate> {
  return http.post<EmailTemplate>('/admin/email-templates', payload);
}

/** UC-09 AF-01: PUT /api/admin/email-templates/{id} */
export function updateEmailTemplate(id: number, payload: EmailTemplatePayload): Promise<EmailTemplate> {
  return http.put<EmailTemplate>(`/admin/email-templates/${id}`, payload);
}

/** UC-09 AF-02: DELETE /api/admin/email-templates/{id} */
export function deleteEmailTemplate(id: number): Promise<void> {
  return http.delete<void>(`/admin/email-templates/${id}`);
}



/**
 * UC-09 step 2: GET /api/admin/email-templates/pipeline-stages
 * Lay danh sach stage de hien thi dropdown "Gan Stage".
 */
export function listPipelineStagesForDropdown(): Promise<PipelineStageOption[]> {
  return http.get<PipelineStageOption[]>('/admin/email-templates/pipeline-stages');
}