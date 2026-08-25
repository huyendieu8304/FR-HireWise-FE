import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { AppError } from '@/types/api';
import { ROUTES } from '@/constants/routes';
import { getPublicJobDetail, submitApplication } from '../api/jobsApi';
import { applyFormSchema, type ApplyFormValues } from '../schema';
import { CvDropzone } from '../components/CvDropzone';
import { EMPLOYMENT_TYPE_LABELS } from '../types';

/**
 * UC-17: Ứng viên điền thông tin liên hệ + đính kèm CV để nộp hồ sơ cho 1
 * Job Position đang Published. Normal flow bước 1-7, AF-01 (đã từng ứng
 * tuyển vị trí này) và EX-01/EX-02 (validate) đều xử lý ở đây.
 */
export function ApplyPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<{ duplicate: boolean } | null>(null);

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => getPublicJobDetail(jobId),
    enabled: !!jobId,
    retry: false,
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    defaultValues: { fullName: '', email: '', phone: '' },
  });

  const applyMutation = useMutation({
    mutationFn: (values: ApplyFormValues) => {
      setUploadProgress(0);
      return submitApplication(jobId, values, setUploadProgress);
    },
    onSuccess: (response) => {
      setResult({ duplicate: response.duplicate });
    },
    onError: (error) => {
      setUploadProgress(undefined);
      // EX-01/EX-02 (ME-22/ME-01): backend trả 400 kèm message rõ ràng — hiện
      // inline ngay dưới field CV thay vì toast chung chung.
      if (error instanceof AppError && error.status === 400) {
        setError('cvFile', { message: error.message });
      }
    },
  });

  if (result) {
    return (
      <div className="page-container flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="text-success-600 size-16" weight="fill" />
        <h1 className="text-xl font-bold text-neutral-900">
          {result.duplicate ? 'Cập nhật hồ sơ thành công!' : 'Nộp hồ sơ thành công!'}
        </h1>
        <p className="text-neutral-600">
          {result.duplicate
            ? // ME-23: đã từng ứng tuyển vị trí này — CV mới được cập nhật vào hồ sơ hiện có.
              'Bạn đã từng ứng tuyển vị trí này. CV mới của bạn đã được cập nhật vào hồ sơ ứng tuyển hiện có.'
            : // ME-24
              'Chúng tôi đã nhận được hồ sơ của bạn và đã gửi email xác nhận tới địa chỉ email bạn cung cấp.'}
        </p>
        <Button variant="outline" onClick={() => navigate(ROUTES.CAREERS)}>
          Xem thêm vị trí khác
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl py-8">
      <Link
        to={`${ROUTES.CAREERS}?job=${jobId}`}
        className="text-primary-600 mb-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="size-4" />
        Quay lại tin
      </Link>

      <div className="mb-6 rounded-md bg-primary-50 p-4">
        {isJobLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : job ? (
          <>
            <p className="text-primary-700 text-sm font-medium">Ứng tuyển: {job.title}</p>
            <p className="text-primary-600/80 mt-0.5 text-xs">
              {[
                job.departmentName,
                job.location,
                job.employmentType && EMPLOYMENT_TYPE_LABELS[job.employmentType],
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </>
        ) : (
          <p className="text-danger-600 text-sm">
            Không tìm thấy tin tuyển dụng này, hoặc tin đã ngừng nhận hồ sơ.
          </p>
        )}
      </div>

      {job && (
        <div className="rounded-md border border-neutral-200 bg-neutral-0 p-6">
          <h1 className="text-lg font-bold text-neutral-900">Nộp hồ sơ ứng tuyển</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Điền thông tin liên hệ và đính kèm CV — chỉ mất 2 phút.
          </p>

          <form
            noValidate
            className="mt-6 flex flex-col gap-4"
            onSubmit={handleSubmit((values) => applyMutation.mutate(values))}
          >
            <TextInput
              label="Họ tên"
              placeholder="Nguyễn Văn An"
              required
              error={errors.fullName?.message}
              disabled={applyMutation.isPending}
              {...register('fullName')}
            />
            <TextInput
              label="Email"
              type="email"
              placeholder="an.nguyen@gmail.com"
              required
              error={errors.email?.message}
              disabled={applyMutation.isPending}
              {...register('email')}
            />
            <TextInput
              label="Số điện thoại"
              placeholder="09xx xxx xxx"
              required
              error={errors.phone?.message}
              disabled={applyMutation.isPending}
              {...register('phone')}
            />

            <Controller
              name="cvFile"
              control={control}
              render={({ field }) => (
                <CvDropzone
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.cvFile?.message}
                  uploadProgress={applyMutation.isPending ? uploadProgress : undefined}
                  disabled={applyMutation.isPending}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={applyMutation.isPending}
              disabled={applyMutation.isPending}
            >
              Nộp hồ sơ
            </Button>
            <p className="text-center text-xs text-neutral-400">
              Bằng việc nộp hồ sơ, bạn đồng ý với Chính sách bảo mật của HireWise.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
