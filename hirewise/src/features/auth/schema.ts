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
