import { z } from 'zod';

/** BR-APPLY-01: chỉ .pdf/.doc/.docx, tối đa 10MB (ME-22). */
export const CV_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const CV_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const CV_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function hasAllowedCvExtension(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return !!extension && CV_ALLOWED_EXTENSIONS.includes(extension);
}

/** Khớp Vietnamese mobile format validate ở backend (`SubmitApplicationRequestDto.phone`). */
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/** UC-17 REF bảng field: Họ tên/Email/Số điện thoại bắt buộc + CV bắt buộc, đúng định dạng/dung lượng. */
export const applyFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(150, 'Họ tên tối đa 150 ký tự'),
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(VN_PHONE_REGEX, 'Số điện thoại không đúng định dạng Việt Nam'),
  cvFile: z
    .instanceof(File, { message: 'Vui lòng đính kèm CV' })
    .refine((file) => file.size > 0, 'Vui lòng đính kèm CV')
    .refine((file) => file.size <= CV_MAX_SIZE_BYTES, 'CV vượt quá dung lượng tối đa 10MB')
    .refine(
      (file) =>
        CV_ALLOWED_MIME_TYPES.includes(file.type) || hasAllowedCvExtension(file.name),
      'Chỉ hỗ trợ file .pdf, .doc, .docx',
    ),
});

export type ApplyFormValues = z.infer<typeof applyFormSchema>;
