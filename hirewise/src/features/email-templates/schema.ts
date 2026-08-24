import { z } from 'zod';

/**
 * UC-09: form validation schema for creating or editing an email template.
 * Mirrors CreateEmailTemplateRequestDto / UpdateEmailTemplateRequestDto validation.
 */
export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Vui long nhap ten template').max(150, 'Ten khong vuot qua 150 ky tu'),
  code: z
    .string()
    .min(1, 'Vui long nhap ma template')
    .max(50, 'Ma khong vuot qua 50 ky tu')
    .regex(/^[A-Za-z0-9_\-]+$/, 'Ma chi chua chu cai, so, dau gach ngang hoac gach duoi'),
  pipelineStageId: z.string().optional(),
  subjectTemplate: z.string().min(1, 'Vui long nhap tieu de email').max(255, 'Tieu de khong vuot qua 255 ky tu'),
  bodyTemplate: z.string().min(1, 'Vui long nhap noi dung email'),
});

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;