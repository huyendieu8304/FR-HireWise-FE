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

// ---------------------------------------------------------------------------
// UC-12: Soạn thảo và tạo yêu cầu tuyển dụng (Job Position) mới
// ---------------------------------------------------------------------------

/**
 * Chỉ validate đúng những trường "Bắt buộc khi Lưu nháp" theo Screen
 * Description UC-12 (Tên/Phòng ban/Số lượng chỉ tiêu) + 2 rule áp dụng
 * cho chính field đó bất kể Draft hay Submit (BR-JOB-02/EX-02,
 * BR-JOB-03/EX-03) — validate đầy đủ hơn (Loại hình, Pipeline Template...)
 * thuộc UC-13 "Gửi duyệt", chưa làm ở form này.
 */
export const jobPositionFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập chức danh').max(120, 'Chức danh tối đa 120 ký tự'),
    // Select trả string; '' = chưa chọn.
    departmentId: z.string().min(1, 'Vui lòng chọn phòng ban'),
    employmentType: z.string(),
    // NumberInput trả number | null — cả 2 cùng null = "Thỏa thuận".
    salaryMin: z.number().nullable(),
    salaryMax: z.number().nullable(),
    openings: z
      .number({
        required_error: 'Vui lòng nhập số lượng chỉ tiêu',
        invalid_type_error: 'Vui lòng nhập số lượng chỉ tiêu',
      })
      .int()
      .min(1, 'Số lượng chỉ tiêu phải từ 1 trở lên'),
    // DatePicker trả chuỗi 'YYYY-MM-DD'; '' = không giới hạn.
    applicationDeadline: z.string(),
    location: z.string(),
    description: z.string(),
    requirements: z.string(),
    benefits: z.string(),
  })
  .refine(
    (data) => data.salaryMin === null || data.salaryMax === null || data.salaryMin <= data.salaryMax,
    { message: 'Mức lương tối thiểu không được lớn hơn mức lương tối đa (EX-02)', path: ['salaryMax'] },
  )
  .refine(
    (data) => data.applicationDeadline === '' || new Date(data.applicationDeadline) > new Date(),
    { message: 'Hạn nộp hồ sơ phải là một ngày trong tương lai (EX-03)', path: ['applicationDeadline'] },
  );

export type JobPositionFormValues = z.infer<typeof jobPositionFormSchema>;
