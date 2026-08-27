/**
 * UC-16 REF field "mức lương nếu công khai" — job_positions.salary_min/max là
 * NUMERIC, `null` khi tin không công khai mức lương (Thỏa thuận).
 */
export function formatSalaryRange(
  salaryMin: number | null,
  salaryMax: number | null,
): string {
  if (salaryMin == null && salaryMax == null) return 'Thỏa thuận';
  const toTrieu = (value: number) => (value / 1_000_000).toLocaleString('vi-VN');
  if (salaryMin != null && salaryMax != null) {
    return `${toTrieu(salaryMin)} - ${toTrieu(salaryMax)} triệu`;
  }
  const single = salaryMin ?? salaryMax;
  return single != null ? `Từ ${toTrieu(single)} triệu` : 'Thỏa thuận';
}
