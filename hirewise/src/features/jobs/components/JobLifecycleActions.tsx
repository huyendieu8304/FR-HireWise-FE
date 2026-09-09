import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowCounterClockwise,
  PauseCircle,
  Prohibit,
  ShareNetwork,
  UploadSimple,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { useDialog } from '@/hooks/useDialog';
import { useNotification } from '@/hooks/useNotification';
import { useAuthStore } from '@/store/useAuthStore';
import { closeJob, pauseJob, publishJob, resumeJob } from '../api/internalJobsApi';
import type { InternalJobDetail } from '../types';
import { JobLifecycleReasonModal } from './JobLifecycleReasonModal';

export interface JobLifecycleActionsProps {
  job: InternalJobDetail;
  /** Mở modal UC-31. Chỉ hiện nút khi Job đang Published. */
  onShare: () => void;
}

type ReasonModal = 'pause' | 'close' | null;

/**
 * UC-45 + UC-44 — nhóm nút vòng đời của 1 Job Position sau khi Hiring
 * Manager đã duyệt, hiện ở header `JobDetailPage`:
 *
 * | Trạng thái  | Nút hiện ra                              |
 * |-------------|------------------------------------------|
 * | `APPROVED`  | Đăng tin                                 |
 * | `PUBLISHED` | Chia sẻ, Tạm dừng, Đóng vị trí           |
 * | `PAUSED`    | Mở lại, Đóng vị trí                      |
 * | `CLOSED`    | không có nút nào (BR-JOB-05: terminal)   |
 *
 * Nút Chia sẻ (UC-31) chỉ hiện khi Published vì BR-POST-01 chặn chia sẻ Job ở
 * mọi trạng thái khác, và link đã chia sẻ của Job Paused/Closed cũng trả 404.
 *
 * Draft/Rejected/Pending Approval do `JobDetailPage` tự lo (Chỉnh sửa, Gửi
 * duyệt) nên component này trả về `null`.
 *
 * Đăng tin và Mở lại chỉ cần xác nhận đơn giản nên dùng `useDialog().confirm`.
 * Tạm dừng và Đóng vị trí có thêm ô lý do (tuỳ chọn) nên phải dùng modal
 * riêng — xem `JobLifecycleReasonModal`.
 */
export function JobLifecycleActions({ job, onShare }: JobLifecycleActionsProps) {
  const notify = useNotification();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [reasonModal, setReasonModal] = useState<ReasonModal>(null);

  const canPublish = useAuthStore(
    (state) => state.user?.permissions.includes('JOB_PUBLISH') ?? false,
  );
  const canClosePause = useAuthStore(
    (state) => state.user?.permissions.includes('JOB_CLOSE_PAUSE') ?? false,
  );

  /**
   * Cả 4 hành động đều chỉ đổi `status` của cùng 1 Job, nên dùng chung một
   * mutation: `mutationFn` nhận sẵn hàm gọi API để tránh 4 khối `useMutation`
   * lặp lại y hệt nhau.
   */
  const lifecycleMutation = useMutation({
    mutationFn: ({
      run,
    }: {
      run: () => Promise<InternalJobDetail>;
      successMessage: string;
    }) => run(),
    onSuccess: (_updated, variables) => {
      notify.success(variables.successMessage);
      queryClient.invalidateQueries({ queryKey: ['jobs', 'internal-detail', job.id] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'internal-list'] });
      setReasonModal(null);
    },
    // 409 khi trạng thái không cho phép và 403 khi không phải chủ Job đều không
    // được apiClient tự toast (xem lib/apiClient.ts), nên phải báo ở đây.
    onError: (error) => notify.error(error),
  });

  async function handlePublish() {
    const ok = await confirm({
      title: 'Đăng tin tuyển dụng?',
      description: `"${job.title}" sẽ hiển thị công khai trên Job Board và bắt đầu nhận hồ sơ ứng tuyển ngay lập tức.`,
      confirmLabel: 'Đăng tin',
    });
    if (ok) {
      lifecycleMutation.mutate({
        run: () => publishJob(job.id),
        successMessage: 'Đã đăng tin lên Job Board.',
      });
    }
  }

  async function handleResume() {
    const ok = await confirm({
      title: 'Mở lại vị trí tuyển dụng?',
      description: `"${job.title}" sẽ hiển thị lại trên Job Board và nhận hồ sơ trở lại ngay, không cần Hiring Manager duyệt lại.`,
      confirmLabel: 'Mở lại',
    });
    if (ok) {
      lifecycleMutation.mutate({
        run: () => resumeJob(job.id),
        successMessage: 'Đã mở lại vị trí tuyển dụng.',
      });
    }
  }

  const isPublishable = job.status === 'APPROVED';
  const isPausable = job.status === 'PUBLISHED';
  const isResumable = job.status === 'PAUSED';
  const isClosable = job.status === 'PUBLISHED' || job.status === 'PAUSED';

  const showPublish = canPublish && isPublishable;
  // BR-POST-01: chỉ Job đang Published mới chia sẻ ra kênh ngoài được, và
  // backend gác endpoint bằng cùng permission JOB_PUBLISH.
  const showShare = canPublish && job.status === 'PUBLISHED';
  const showClosePause = canClosePause && (isPausable || isResumable || isClosable);
  if (!showPublish && !showShare && !showClosePause) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showShare && (
        <Button size="sm" onClick={onShare}>
          <ShareNetwork className="size-4" />
          Chia sẻ
        </Button>
      )}

      {showPublish && (
        <Button size="sm" isLoading={lifecycleMutation.isPending} onClick={handlePublish}>
          <UploadSimple className="size-4" />
          Đăng tin
        </Button>
      )}

      {canClosePause && isResumable && (
        <Button size="sm" isLoading={lifecycleMutation.isPending} onClick={handleResume}>
          <ArrowCounterClockwise className="size-4" />
          Mở lại
        </Button>
      )}

      {canClosePause && isPausable && (
        <Button
          variant="outline"
          size="sm"
          disabled={lifecycleMutation.isPending}
          onClick={() => setReasonModal('pause')}
        >
          <PauseCircle className="size-4" />
          Tạm dừng
        </Button>
      )}

      {canClosePause && isClosable && (
        <Button
          variant="danger"
          size="sm"
          disabled={lifecycleMutation.isPending}
          onClick={() => setReasonModal('close')}
        >
          <Prohibit className="size-4" />
          Đóng vị trí
        </Button>
      )}

      <JobLifecycleReasonModal
        open={reasonModal === 'pause'}
        onClose={() => setReasonModal(null)}
        title="Tạm dừng vị trí tuyển dụng?"
        description={`"${job.title}" sẽ bị ẩn khỏi Job Board và ngừng nhận hồ sơ mới. Ứng viên và hồ sơ hiện có được giữ nguyên, bạn có thể Mở lại bất kỳ lúc nào.`}
        confirmLabel="Tạm dừng"
        isPending={lifecycleMutation.isPending}
        onConfirm={(reason) =>
          lifecycleMutation.mutate({
            run: () => pauseJob(job.id, reason),
            successMessage: 'Đã tạm dừng vị trí tuyển dụng.',
          })
        }
      />

      <JobLifecycleReasonModal
        open={reasonModal === 'close'}
        onClose={() => setReasonModal(null)}
        title="Đóng vị trí tuyển dụng?"
        description={`"${job.title}" sẽ bị ẩn khỏi Job Board và ngừng nhận hồ sơ vĩnh viễn.`}
        confirmLabel="Đóng vị trí"
        tone="danger"
        warning="Hành động này không thể hoàn tác. Muốn tuyển lại vị trí tương tự, bạn phải tạo Job Position mới."
        isPending={lifecycleMutation.isPending}
        onConfirm={(reason) =>
          lifecycleMutation.mutate({
            run: () => closeJob(job.id, reason),
            successMessage: 'Đã đóng vị trí tuyển dụng.',
          })
        }
      />
    </div>
  );
}
