import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { RichTextEditor } from '@/features/email-templates/components/RichTextEditor';
import { useNotification } from '@/hooks/useNotification';
import { listDepartments } from '@/features/users/api/usersApi';
import { ROUTES } from '@/constants/routes';
import {
  createInternalJob,
  getInternalJobDetail,
  updateInternalJob,
} from '../api/internalJobsApi';
import { jobPositionFormSchema, type JobPositionFormValues } from '../schema';
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType, type JobPositionFormPayload } from '../types';

const EMPLOYMENT_TYPE_OPTIONS = (
  Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]
).map((type) => ({ value: type, label: EMPLOYMENT_TYPE_LABELS[type] }));

const EMPTY_FORM_VALUES: JobPositionFormValues = {
  title: '',
  departmentId: '',
  employmentType: '',
  salaryMin: null,
  salaryMax: null,
  openings: 1,
  applicationDeadline: '',
  location: '',
  description: '',
  requirements: '',
  benefits: '',
};

/**
 * UC-12: Soạn thảo và tạo yêu cầu tuyển dụng (Job Position) mới, dùng
 * CHUNG cho 2 route:
 * - `/jobs/new`      — tạo mới (Normal Flow bước 1-6).
 * - `/jobs/:jobId/edit` — "Lưu nháp" lại 1 Job đang Draft/Rejected (AF-01).
 *
 * Chỉ validate đúng tập field "Bắt buộc khi Lưu nháp" theo Screen
 * Description (Tên/Phòng ban/Số lượng chỉ tiêu) — validate đầy đủ hơn
 * (Loại hình, Pipeline Template...) thuộc UC-13 "Gửi duyệt", chưa làm ở
 * đây. JD 3 khối dùng lại `RichTextEditor` đã có sẵn từ feature Email
 * Template (UC-09) thay vì viết mới.
 */
export function JobFormPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const isEditMode = jobId !== undefined;
  const navigate = useNavigate();
  const notify = useNotification();
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: () => listDepartments(),
  });

  const { data: existingJob, isLoading: isLoadingJob } = useQuery({
    queryKey: ['jobs', 'internal-detail', jobId],
    queryFn: () => getInternalJobDetail(jobId!),
    enabled: isEditMode,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobPositionFormValues>({
    resolver: zodResolver(jobPositionFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  // Đợi load xong dữ liệu Job cũ (chế độ edit) rồi mới đổ vào form — dùng
  // reset() thay vì defaultValues vì dữ liệu tới bất đồng bộ sau khi mount.
  useEffect(() => {
    if (!existingJob) return;
    reset({
      title: existingJob.title,
      departmentId: existingJob.departmentId ? String(existingJob.departmentId) : '',
      employmentType: existingJob.employmentType ?? '',
      salaryMin: existingJob.salaryMin,
      salaryMax: existingJob.salaryMax,
      openings: existingJob.openings,
      applicationDeadline: existingJob.applicationDeadline ?? '',
      location: existingJob.location ?? '',
      description: existingJob.description ?? '',
      requirements: existingJob.requirements ?? '',
      benefits: existingJob.benefits ?? '',
    });
  }, [existingJob, reset]);

  function toPayload(values: JobPositionFormValues): JobPositionFormPayload {
    return {
      title: values.title,
      // Select trả string; convert sang number ở đúng ranh giới gọi API.
      departmentId: Number(values.departmentId),
      employmentType: values.employmentType ? (values.employmentType as EmploymentType) : null,
      salaryMin: values.salaryMin,
      salaryMax: values.salaryMax,
      openings: values.openings,
      applicationDeadline: values.applicationDeadline || null,
      location: values.location || null,
      description: values.description || null,
      requirements: values.requirements || null,
      benefits: values.benefits || null,
    };
  }

  const saveMutation = useMutation({
    mutationFn: (values: JobPositionFormValues) =>
      isEditMode
        ? updateInternalJob(jobId!, toPayload(values))
        : createInternalJob(toPayload(values)),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'internal-list'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'internal-detail', job.id] });
      notify.success(
        isEditMode ? `Đã lưu nháp "${job.title}".` : `Đã tạo Job "${job.title}" (Bản nháp).`,
      );
      navigate(ROUTES.JOB_DETAIL.replace(':jobId', job.id));
    },
    onError: (error) => notify.error(error),
  });

  const departmentOptions = (departments ?? []).map((dept) => ({
    value: String(dept.id),
    label: dept.name,
  }));

  const backTo = isEditMode && jobId ? ROUTES.JOB_DETAIL.replace(':jobId', jobId) : ROUTES.JOBS;

  if (isEditMode && isLoadingJob) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          to={backTo}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="size-4" />
          <span>{isEditMode ? 'Quay lại chi tiết Job' : 'Quay lại danh sách vị trí tuyển dụng'}</span>
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEditMode ? 'Chỉnh sửa Job Position' : 'Tạo Job Position mới'}
        </h1>
        <p className="text-sm text-neutral-500">
          Job luôn bắt đầu ở trạng thái Bản nháp — có thể lưu nháp nhiều lần trước khi gửi duyệt.
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        noValidate
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
      >
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">Thông tin chung</h2>
          <TextInput
            label="Chức danh (Job Title)"
            placeholder="vd. Backend Engineer"
            required
            error={errors.title?.message}
            {...register('title')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Phòng ban"
              placeholder="Chọn phòng ban"
              required
              options={departmentOptions}
              error={errors.departmentId?.message}
              {...register('departmentId')}
            />
            <Select
              label="Loại hình"
              placeholder="Chọn loại hình"
              options={EMPLOYMENT_TYPE_OPTIONS}
              error={errors.employmentType?.message}
              {...register('employmentType')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">Mức lương &amp; chỉ tiêu</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="salaryMin"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label="Lương tối thiểu"
                  helperText="Bỏ trống cả 2 ô lương nếu Thỏa thuận."
                  currencySymbol="₫"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="salaryMax"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label="Lương tối đa"
                  currencySymbol="₫"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="openings"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  label="Số lượng chỉ tiêu"
                  required
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={1}
                  error={fieldState.error?.message}
                />
              )}
            />
            <DatePicker
              label="Hạn nộp hồ sơ"
              mode="date"
              helperText="Bỏ trống nếu không giới hạn."
              error={errors.applicationDeadline?.message}
              {...register('applicationDeadline')}
            />
          </div>
          <TextInput
            label="Địa điểm làm việc"
            placeholder="vd. Hồ Chí Minh"
            error={errors.location?.message}
            {...register('location')}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">Mô tả công việc (JD)</h2>
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">1. Mô tả công việc</label>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Mô tả công việc cần làm..."
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />
          <Controller
            name="requirements"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">2. Yêu cầu ứng viên</label>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Yêu cầu về kinh nghiệm, kỹ năng..."
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />
          <Controller
            name="benefits"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">3. Quyền lợi</label>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Quyền lợi, đãi ngộ..."
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
            Hủy
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            Lưu nháp
          </Button>
        </div>
      </form>
    </div>
  );
}
