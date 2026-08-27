import { z } from 'zod';

/** UC-04 AF-01: tạo Pipeline Template mới. */
export const createPipelineTemplateSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên Template').max(150, 'Tên tối đa 150 ký tự'),
  // Select trả string; '' = để trống = dùng chung toàn hệ thống (AF-01).
  departmentId: z.string().optional(),
});

export type CreatePipelineTemplateFormValues = z.infer<
  typeof createPipelineTemplateSchema
>;

/**
 * UC-04 main flow: thêm 1 Stage mới. Rule khớp
 * `CreatePipelineStageRequestDto` (backend) — validate trước ở FE để báo
 * lỗi sớm, backend vẫn là nguồn sự thật cuối cùng (BR-PIPE-02).
 */
export const createPipelineStageSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên Stage').max(50, 'Tên tối đa 50 ký tự'),
  code: z
    .string()
    .min(1, 'Vui lòng nhập mã Stage')
    .max(50, 'Mã tối đa 50 ký tự')
    // BR-PIPE-02 / Screen Description UC-04: viết hoa, không dấu.
    .regex(/^[A-Z0-9_]+$/, 'Mã chỉ gồm chữ HOA, số và dấu gạch dưới (_)'),
  // Liệt kê trực tiếp (thay vì cast ALL_STAGE_TYPES từ types.ts) để z.infer suy
  // ra đúng union StageType, không bị rộng thành `string`.
  stageType: z.enum(
    [
      'INTAKE',
      'SCREENING',
      'INTERVIEW',
      'OFFER',
      'TERMINAL_SUCCESS',
      'TERMINAL_REJECTED',
    ],
    { message: 'Vui lòng chọn Loại Stage' },
  ),
  terminal: z.boolean(),
  // NumberInput trả number | null — optional thật sự (SLA không bắt buộc).
  slaHours: z.number().positive('SLA phải là số giờ dương').nullable(),
});

export type CreatePipelineStageFormValues = z.infer<typeof createPipelineStageSchema>;
