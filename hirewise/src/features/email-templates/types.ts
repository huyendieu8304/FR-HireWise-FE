/**
 * Kieu du lieu cho UC-09 (Email Template Management) - khop chinh xac
 * theo DTO that cua backend (EmailTemplateResponseDto / PipelineStageResponseDto).
 */

/** Khop EmailTemplateStatus.java */
export type EmailTemplateStatus = 'ACTIVE' | 'INACTIVE';

/** Khop StageType.java */
export type StageType = 'SCREEN' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

/** Khop EmailTemplateResponseDto */
export interface EmailTemplate {
  id: number;
  code: string;
  name: string;
  pipelineStageId: number | null;
  pipelineStageName: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  version: number;
  status: EmailTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

/** Khop PipelineStageResponseDto - dung cho dropdown "Gan Stage" */
export interface PipelineStageOption {
  id: number;
  name: string;
  code: string;
  stageType: StageType;
  position: number;
  pipelineTemplateName: string | null;
}