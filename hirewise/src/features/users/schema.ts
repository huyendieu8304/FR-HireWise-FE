import { z } from 'zod';

/** UC-02 Screen Description mục 5: Modal Thêm User — Email/Họ tên/Phòng ban đều bắt buộc. */
export const addUserSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  departmentId: z.string().min(1, 'Vui lòng chọn phòng ban'),
});

export type AddUserFormValues = z.infer<typeof addUserSchema>;
