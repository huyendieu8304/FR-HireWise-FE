/**
 * Kiểu dữ liệu cho UC-02 (User Management) và UC-03 (RBAC) — khớp chính xác
 * theo DTO thật của backend (`FR-HireWise-BE/.../dto/`). Xem
 * `hirewise/docs/GUIDE.md` mục "Gọi API mới" nếu cần đối chiếu quy ước.
 */

/** 5 role hệ thống (seed trong V2__create_roles_and_permissions.sql). CANDIDATE không quản lý ở màn hình này. */
export type Role = 'HR_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER';

export const ALL_ROLES: Role[] = [
  'HR_ADMIN',
  'RECRUITER',
  'HIRING_MANAGER',
  'INTERVIEWER',
];

export const ROLE_LABELS: Record<Role, string> = {
  HR_ADMIN: 'HR Admin',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
  INTERVIEWER: 'Interviewer',
};

/** Khớp `UserStatus.java` — chú ý viết HOA toàn bộ, khác `Role` string tự do. */
export type UserStatus = 'INVITED' | 'ACTIVE' | 'BLOCKED' | 'DISABLED';

/** Khớp `ScopeType.java` (RBAC layer 3). */
export type AccessScopeType = 'SYSTEM' | 'DEPARTMENT' | 'JOB';

/** Khớp `DepartmentResponseDto`. */
export interface Department {
  id: number;
  name: string;
}

/**
 * ⚠️ Chưa có backend cho Job Position — dùng tạm placeholder cho tới khi
 * feature Job Position (UC-12/13) có endpoint thật để list job đang mở.
 */
export interface JobOption {
  id: string;
  title: string;
}

/** Khớp `UserResponseDto` — trả về từ list/get, KHÔNG chứa access scope. */
export interface UserAccount {
  id: number;
  email: string;
  fullName: string;
  departmentId: number | null;
  departmentName: string | null;
  status: UserStatus;
  roleCodes: Role[];
  lastAuthenticatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Khớp `UserAccessScopeResponseDto` — lấy riêng qua
 * `GET /admin/users/{id}/access-scopes`, KHÔNG nằm trong `UserAccount`.
 */
export interface UserAccessScope {
  id: number;
  scopeType: AccessScopeType;
  departmentId: number | null;
  departmentName: string | null;
  jobId: string | null;
  includeSubDepartments: boolean;
  canWrite: boolean;
  validFrom: string;
  validTo: string | null;
}
