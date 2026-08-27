import { MagnifyingGlass } from '@phosphor-icons/react';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType, type JobFilterOptions } from '../types';

export interface JobFiltersValue {
  keyword: string;
  departmentId: string;
  employmentType: string;
}

export interface JobFiltersProps {
  value: JobFiltersValue;
  onChange: (value: JobFiltersValue) => void;
  options: JobFilterOptions | undefined;
}

/** UC-16 REF bảng field #2: Bộ lọc (Phòng ban/Loại hình/Từ khóa). */
export function JobFilters({ value, onChange, options }: JobFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <TextInput
        containerClassName="flex-1"
        placeholder="Tìm theo tên vị trí, kỹ năng..."
        prefixIcon={<MagnifyingGlass />}
        value={value.keyword}
        onChange={(event) => onChange({ ...value, keyword: event.target.value })}
      />
      <Select
        containerClassName="sm:w-48"
        placeholder="Tất cả phòng ban"
        value={value.departmentId}
        onChange={(event) => onChange({ ...value, departmentId: event.target.value })}
        options={(options?.departments ?? []).map((department) => ({
          value: String(department.id),
          label: department.name,
        }))}
      />
      <Select
        containerClassName="sm:w-44"
        placeholder="Loại hình"
        value={value.employmentType}
        onChange={(event) => onChange({ ...value, employmentType: event.target.value })}
        options={(options?.employmentTypes ?? []).map((type: EmploymentType) => ({
          value: type,
          label: EMPLOYMENT_TYPE_LABELS[type],
        }))}
      />
    </div>
  );
}
