import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { getJobFilterOptions, getPublicJobDetail, listPublicJobs } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { JobFilters, type JobFiltersValue } from '../components/JobFilters';
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from '../types';
import { formatSalaryRange } from '../utils';
import { ROUTES } from '@/constants/routes';

const EMPTY_FILTERS: JobFiltersValue = { keyword: '', departmentId: '', employmentType: '' };

/**
 * UC-16: Public Job Board — ứng viên (chưa cần đăng nhập) duyệt danh sách
 * Job Published, lọc theo phòng ban/loại hình/từ khóa, và xem chi tiết JD.
 */
export function JobBoardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<JobFiltersValue>(EMPTY_FILTERS);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // UC-16 step 3: lọc theo từ khóa — debounce 400ms để không gọi API mỗi phím gõ.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(filters.keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [filters.keyword]);

  const { data: filterOptions } = useQuery({
    queryKey: ['jobs', 'filter-options'],
    queryFn: getJobFilterOptions,
  });

  const { data: jobsPage, isLoading: isListLoading } = useQuery({
    queryKey: [
      'jobs',
      'list',
      debouncedKeyword,
      filters.departmentId,
      filters.employmentType,
    ],
    queryFn: () =>
      listPublicJobs({
        size: 20,
        keyword: debouncedKeyword || undefined,
        departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
        employmentType: filters.employmentType
          ? (filters.employmentType as EmploymentType)
          : undefined,
      }),
  });

  const jobs = jobsPage?.content ?? [];
  const selectedJobId = searchParams.get('job') ?? jobs[0]?.id ?? '';

  // UC-16 step 4 giữ selection hợp lệ: nếu job đang chọn không còn trong danh
  // sách đã lọc (vd đổi bộ lọc), tự chuyển sang job đầu tiên của danh sách mới.
  useEffect(() => {
    if (jobs.length === 0) return;
    if (!jobs.some((job) => job.id === selectedJobId)) {
      const next = new URLSearchParams(searchParams);
      next.set('job', jobs[0].id);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const { data: jobDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['jobs', 'detail', selectedJobId],
    queryFn: () => getPublicJobDetail(selectedJobId),
    enabled: !!selectedJobId,
  });

  const jobCountLabel = useMemo(() => {
    const total = jobsPage?.totalElements ?? 0;
    return `${total} vị trí đang tuyển tại HireWise`;
  }, [jobsPage?.totalElements]);

  function selectJob(jobId: string) {
    const next = new URLSearchParams(searchParams);
    next.set('job', jobId);
    setSearchParams(next);
  }

  return (
    <div className="page-container flex flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Tìm vị trí phù hợp với bạn</h1>
        <p className="mt-1 text-neutral-500">{jobCountLabel} — cập nhật liên tục</p>
      </div>

      <JobFilters value={filters} onChange={setFilters} options={filterOptions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-3">
          {isListLoading &&
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}

          {!isListLoading && jobs.length === 0 && (
            // EX-01: không có Job nào Published.
            <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
              Hiện chưa có vị trí tuyển dụng nào.
            </div>
          )}

          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              active={job.id === selectedJobId}
              onClick={() => selectJob(job.id)}
            />
          ))}
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-0 p-6">
          {isDetailLoading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {!isDetailLoading && jobDetail && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{jobDetail.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                    {jobDetail.departmentName && <span>{jobDetail.departmentName}</span>}
                    {jobDetail.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4" />
                        {jobDetail.location}
                      </span>
                    )}
                    {jobDetail.employmentType && (
                      <Badge variant="primary">{EMPLOYMENT_TYPE_LABELS[jobDetail.employmentType]}</Badge>
                    )}
                    <span className="inline-flex items-center gap-1 font-medium text-success-700">
                      <Briefcase className="size-4" />
                      {formatSalaryRange(jobDetail.salaryMin, jobDetail.salaryMax)}
                    </span>
                  </div>
                </div>
                <Button onClick={() => navigate(`${ROUTES.CAREERS}/${jobDetail.id}/apply`)}>
                  Ứng tuyển ngay
                </Button>
              </div>

              <JdSection title="Mô tả công việc" content={jobDetail.description} />
              <JdSection title="Yêu cầu ứng viên" content={jobDetail.requirements} />
              <JdSection title="Quyền lợi" content={jobDetail.benefits} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JdSection({ title, content }: { title: string; content: string | null }) {
  if (!content) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-neutral-700 uppercase">
        {title}
      </h3>
      <p className="text-sm whitespace-pre-line text-neutral-600">{content}</p>
    </div>
  );
}
