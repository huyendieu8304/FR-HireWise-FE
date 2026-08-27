import { Briefcase, MapPin } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge/Badge';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters/date';
import { EMPLOYMENT_TYPE_LABELS, type JobSummary } from '../types';
import { formatSalaryRange } from '../utils';

export interface JobCardProps {
  job: JobSummary;
  active?: boolean;
  onClick: () => void;
}

/** UC-16 REF bảng field #1: 1 thẻ trong danh sách Job Published (Chức danh/Phòng ban/Loại hình/Địa điểm). */
export function JobCard({ job, active, onClick }: JobCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-md border p-4 text-left transition-colors',
        active
          ? 'border-primary-500 bg-primary-50'
          : 'border-neutral-200 bg-neutral-0 hover:border-neutral-300 hover:bg-neutral-50',
      )}
    >
      <p className="font-semibold text-neutral-900">{job.title}</p>
      {job.departmentName && (
        <p className="mt-0.5 text-sm text-neutral-500">{job.departmentName}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.employmentType && (
          <Badge variant="primary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-success-700">
          <Briefcase className="size-3.5" />
          {formatSalaryRange(job.salaryMin, job.salaryMax)}
        </span>
        <span className="text-xs text-neutral-400">Đăng {formatRelativeTime(job.createdAt)}</span>
      </div>
    </button>
  );
}
