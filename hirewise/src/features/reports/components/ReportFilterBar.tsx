import { useQuery } from '@tanstack/react-query';
import { ArrowCounterClockwise } from '@phosphor-icons/react';
import { Button, DatePicker, Select } from '@/components/ui';
import { listDepartments } from '@/features/users/api/usersApi';
import { listInternalJobs } from '@/features/jobs/api/internalJobsApi';
import type { ReportFilterValue } from '../types';

export interface ReportFilterBarProps {
  value: ReportFilterValue;
  onChange: (value: ReportFilterValue) => void;
}

const EMPTY: ReportFilterValue = {
  fromDate: '',
  toDate: '',
  departmentId: '',
  jobPositionId: '',
};

/**
 * BR-RPT-03 — bộ lọc dùng chung cho cả UC-42 và UC-43: khoảng thời gian,
 * phòng ban, Job.
 *
 * Hai điểm lệch so với bảng Screen Description của SRS, đều là cố ý:
 *
 * 1. SRS ghi "Multi-select" nhưng bộ component nền tảng chưa có multi-select /
 *    combobox nào (xem JSDoc của `Select`), nên ở đây dùng single-select. Viết
 *    mới một component nền tảng nằm ngoài phạm vi 2 use case này.
 * 2. Không có date-range picker (xem JSDoc của `DatePicker`), nên ghép 2 ô
 *    "Từ ngày" / "Đến ngày".
 *
 * Để trống cả 2 ô ngày là hợp lệ: backend tự lấy 90 ngày gần nhất.
 *
 * Danh sách phòng ban và Job đổ vào dropdown vốn đã bị giới hạn theo Access
 * Scope ở backend, nên người dùng không thể chọn ra ngoài phạm vi của mình
 * (BR-RPT-02) — và kể cả có sửa tay query param cũng vậy, vì query báo cáo
 * giao bộ lọc với tập Job hợp lệ chứ không tin vào tham số gửi lên.
 */
export function ReportFilterBar({ value, onChange }: ReportFilterBarProps) {
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
    staleTime: 5 * 60 * 1000,
  });

  const { data: jobPage } = useQuery({
    queryKey: ['jobs', 'report-filter-options'],
    queryFn: () => listInternalJobs({ page: 0, size: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const isDirty =
    value.fromDate !== '' ||
    value.toDate !== '' ||
    value.departmentId !== '' ||
    value.jobPositionId !== '';

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 lg:flex-row lg:items-end">
      <DatePicker
        containerClassName="lg:w-44"
        label="Từ ngày"
        mode="date"
        value={value.fromDate}
        onChange={(event) => onChange({ ...value, fromDate: event.target.value })}
      />
      <DatePicker
        containerClassName="lg:w-44"
        label="Đến ngày"
        mode="date"
        value={value.toDate}
        onChange={(event) => onChange({ ...value, toDate: event.target.value })}
      />
      <Select
        containerClassName="lg:w-52"
        label="Phòng ban"
        placeholder="Tất cả phòng ban"
        value={value.departmentId}
        onChange={(event) => onChange({ ...value, departmentId: event.target.value })}
        options={(departments ?? []).map((department) => ({
          value: String(department.id),
          label: department.name,
        }))}
      />
      <Select
        containerClassName="flex-1"
        label="Vị trí tuyển dụng"
        placeholder="Tất cả vị trí"
        value={value.jobPositionId}
        onChange={(event) => onChange({ ...value, jobPositionId: event.target.value })}
        options={(jobPage?.content ?? []).map((job) => ({
          value: job.id,
          label: job.title,
        }))}
      />
      {isDirty && (
        <Button variant="ghost" size="md" onClick={() => onChange(EMPTY)}>
          <ArrowCounterClockwise className="size-4" />
          Xoá bộ lọc
        </Button>
      )}
    </div>
  );
}
