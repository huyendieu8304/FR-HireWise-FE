import { http } from '@/lib/apiClient';
import type { PagedResponse } from '@/types/api';
import type {
  AccessScopeType,
  Department,
  JobOption,
  Role,
  UserAccessScope,
  UserAccount,
  UserStatus,
} from '../types';

/** UC-02 Screen Description mục 3: Dropdown Phòng ban — `GET /api/departments`. */
export function listDepartments(): Promise<Department[]> {
  return http.get<Department[]>('/departments');
}

/**
 * ⚠️ Chưa có backend cho Job Position (UC-12/13 chưa triển khai) — chưa có
 * endpoint để list job đang mở, cần cho lựa chọn "Theo Job cụ thể" ở UC-03.
 * Trả về mảng rỗng để UI không vỡ; thay bằng `http.get('/jobs')` khi có.
 */
export function listJobs(): Promise<JobOption[]> {
  return Promise.resolve([]);
}

export interface ListUsersParams {
  page?: number;
  size?: number;
}

/** UC-02: `GET /api/admin/users` (yêu cầu quyền USER_VIEW — HR_ADMIN). */
export function listUsers(
  params: ListUsersParams = {},
): Promise<PagedResponse<UserAccount>> {
  return http.get<PagedResponse<UserAccount>>('/admin/users', {
    params: { page: params.page ?? 0, size: params.size ?? 100 },
  });
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  departmentId: number;
}

/** UC-02 normal flow: tạo user (status=Invited) + gửi email kích hoạt (yêu cầu quyền USER_CREATE). */
export function createUser(payload: CreateUserPayload): Promise<UserAccount> {
  return http.post<UserAccount>('/admin/users', payload);
}

/** UC-02 AF-02: đổi trạng thái tài khoản (yêu cầu quyền USER_UPDATE). Gọi với status đích tường minh — backend không có API "toggle". */
export function updateUserStatus(
  userId: number,
  status: UserStatus,
): Promise<UserAccount> {
  return http.patch<UserAccount>(`/admin/users/${userId}/status`, { status });
}

/** UC-03: gán 1 role (yêu cầu quyền ROLE_ASSIGN). Gọi nhiều lần nếu gán nhiều role. */
export function assignRole(userId: number, roleCode: Role): Promise<void> {
  return http.post<void>(`/admin/users/${userId}/roles`, { roleCode });
}

/** UC-03 AF-01: thu hồi 1 role đang active. */
export function revokeRole(userId: number, roleCode: Role): Promise<void> {
  return http.delete<void>(`/admin/users/${userId}/roles/${roleCode}`);
}

/** UC-03: xem danh sách access scope hiện tại của user. */
export function listAccessScopes(userId: number): Promise<UserAccessScope[]> {
  return http.get<UserAccessScope[]>(`/admin/users/${userId}/access-scopes`);
}

export interface AssignAccessScopePayload {
  scopeType: AccessScopeType;
  departmentId?: number;
  jobId?: string;
  includeSubDepartments?: boolean;
  canWrite?: boolean;
}

/**
 * UC-03: gán 1 access scope (System/Department/Job) cho user — mỗi lần gọi
 * TẠO MỘT DÒNG MỚI, gọi nhiều lần nếu gán nhiều phòng ban (BR-RBAC-05).
 *
 * ⚠️ Backend hiện CHƯA có endpoint xóa/sửa 1 access scope đã lưu (chỉ có
 * assign + list) — PermissionDrawer vì vậy chỉ cho thêm mới, không cho xóa
 * scope đã lưu từ trước. Cần bổ sung `DELETE /admin/users/{id}/access-scopes/{scopeId}`
 * ở backend nếu muốn hỗ trợ thu hồi giống cơ chế revoke role.
 */
export function assignAccessScope(
  userId: number,
  payload: AssignAccessScopePayload,
): Promise<UserAccessScope> {
  return http.post<UserAccessScope>(`/admin/users/${userId}/access-scopes`, payload);
}
