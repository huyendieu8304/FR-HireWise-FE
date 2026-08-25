import { z } from 'zod';
import { SUPPORTED_VARIABLES } from './components/VariablePicker';

/**
 * UC-09: form validation schema for creating or editing an email template.
 * Mirrors CreateEmailTemplateRequestDto / UpdateEmailTemplateRequestDto validation.
 */

/** Finds all {{Var_Name}} placeholders in a string. */
function findUnsupportedVars(value: string): string[] {
  const matches = [...value.matchAll(/\{\{([^}]+)}}/g)];
  return matches
    .map((m) => m[1].trim())
    .filter((v) => !(SUPPORTED_VARIABLES as readonly string[]).includes(v));
}

const templateFieldSchema = (fieldLabel: string, maxLen?: number) => {
  let base = z.string().min(1, `Vui lòng nhập ${fieldLabel}`);
  if (maxLen) {
    base = base.max(maxLen, `${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)} không vượt quá ${maxLen} ký tự`);
  }
  return base.refine(
    (val) => findUnsupportedVars(val).length === 0,
    (val) => ({
      message: `Biến không hợp lệ: ${findUnsupportedVars(val).join(', ')}. Chỉ hỗ trợ: ${SUPPORTED_VARIABLES.join(', ')} (BR-EMAILTPL-02).`,
    }),
  );
};

export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên template').max(150, 'Tên không vượt quá 150 ký tự'),
  code: z
    .string()
    .min(1, 'Vui lòng nhập mã template')
    .max(50, 'Mã không vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới'),
  pipelineStageId: z.string().optional(),
  subjectTemplate: templateFieldSchema('tiêu đề email', 255),
  bodyTemplate: templateFieldSchema('nội dung email'),
});

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;