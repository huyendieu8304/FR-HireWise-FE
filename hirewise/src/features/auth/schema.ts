import { z } from 'zod';

/**
 * Schema validate form login bằng Zod — dùng chung giữa react-hook-form
 * (client-side validate) và có thể tái dùng để validate response/payload.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Schema đặt mật khẩu lần đầu (UC-02 EM-01 — trang kích hoạt tài khoản).
 * Rule mật khẩu PHẢI khớp `ActivateAccountRequestDto` bên backend (tối
 * thiểu 8 ký tự, có chữ hoa + chữ thường + số) — validate trùng ở
 * frontend chỉ để báo lỗi sớm cho UX, backend vẫn là nguồn sự thật cuối
 * cùng (`FR-HireWise-BE/.../ActivateAccountRequestDto.java`).
 */
export const activateAccountSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(/[a-z]/, 'Mật khẩu cần ít nhất 1 chữ thường')
      .regex(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ hoa')
      .regex(/\d/, 'Mật khẩu cần ít nhất 1 chữ số'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

export type ActivateAccountFormValues = z.infer<typeof activateAccountSchema>;
