/**
 * Kiểu dữ liệu cho UC-16 (Public Job Board) và UC-17 (Điền form ứng tuyển) —
 * khớp chính xác theo DTO thật của backend
 * (`FR-HireWise-BE/.../dto/response/JobBoard*.java`, `SubmitApplication*.java`).
 */

/** Khớp `EmploymentType.java`. */
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
};

/** Khớp `JobBoardSummaryResponseDto` — 1 thẻ (card) trong danh sách UC-16. */
export interface JobSummary {
  id: string;
  title: string;
  departmentName: string | null;
  employmentType: EmploymentType | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
}

/** Khớp `JobBoardDetailResponseDto` — chi tiết JD đầy đủ (UC-16 bước 4). */
export interface JobDetail extends JobSummary {
  openings: number;
  applicationDeadline: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
}

/** Khớp `DepartmentResponseDto` (dùng lại nguyên vẹn cho bộ lọc UC-16 REF 2). */
export interface JobBoardDepartment {
  id: number;
  name: string;
}



