import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WarningCircle } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { listRejectionReasons, rejectApplication } from '../api/applicationsApi';
import { REJECTION_CATEGORY_LABELS } from '../types';

export interface RejectApplicationModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  onRejected?: () => void;
}

const CUSTOM_MESSAGE_MAX_LENGTH = 500;

/**
 * UC-29 main flow: chọn 1 lý do chuẩn hóa từ danh mục (BR-REJ-01, bắt buộc)
 * + ghi chú thêm tùy chọn, rồi xác nhận Từ chối — backend tự chuyển
 * Application sang Stage Terminal-Rejected và gửi email tự động cho ứng
 * viên (UC-30, BR-REJ-02). BR-REJ-03: thao tác này không thể hoàn tác, phải
 * tạo Application mới nếu muốn xem xét lại ứng viên.
 */
export function RejectApplicationModal({
  open,
  onClose,
  applicationId,
  candidateName,
  onRejected,
}: RejectApplicationModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [customMessage, setCustomMessage] = useState('');

  const { data: reasons, isLoading: isLoadingReasons } = useQuery({
    queryKey: ['rejection-reasons'],
    queryFn: listRejectionReasons,
    enabled: open,
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectApplication(applicationId, {
        reasonId: reasonId as number,
        customMessage: customMessage.trim() || undefined,
      }),
    onSuccess: () => {
      notify.success(`Đã từ chối ứng viên "${candidateName}" và gửi email thông báo.`);
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
      handleClose();
      onRejected?.();
    },
    // EX (BR-REJ-03): Application đã ở Stage terminal, lý do không còn ACTIVE,
    // hoặc không đúng quyền sở hữu Job (RBAC Layer 4) — apiClient đã tự toast.
    onError: (error) => {
      notify.error(error);
    },
  });

  function handleClose() {
    setReasonId('');
    setCustomMessage('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => !rejectMutation.isPending && handleClose()}
      title="Từ chối ứng viên"
      description={`Chọn lý do từ chối chuẩn hóa cho "${candidateName}". Thao tác này không thể hoàn tác (BR-REJ-03) — hệ thống sẽ tự động gửi email thông báo kết quả cho ứng viên.`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={rejectMutation.isPending}>
            Hủy
          </Button>
          <Button
            variant="danger"
            isLoading={rejectMutation.isPending}
            disabled={reasonId === ''}
            onClick={() => rejectMutation.mutate()}
          >
            Xác nhận từ chối
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Lý do từ chối"
          placeholder={isLoadingReasons ? 'Đang tải...' : 'Chọn lý do từ chối'}
          required
          disabled={isLoadingReasons}
          options={(reasons ?? []).map((r) => ({
            value: String(r.id),
            label: `${r.label} (${REJECTION_CATEGORY_LABELS[r.category]})`,
          }))}
          value={reasonId === '' ? '' : String(reasonId)}
          onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : '')}
        />

        {!isLoadingReasons && (reasons ?? []).length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
            <WarningCircle className="mt-0.5 size-4 shrink-0" />
            <span>Chưa có lý do từ chối nào trong danh mục. Liên hệ quản trị hệ thống.</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-custom-message" className="text-sm font-medium text-neutral-800">
            Ghi chú thêm <span className="font-normal text-neutral-400">(không bắt buộc)</span>
          </label>
          <textarea
            id="reject-custom-message"
            rows={3}
            maxLength={CUSTOM_MESSAGE_MAX_LENGTH}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Ví dụ: Kinh nghiệm chưa đủ với vị trí Senior; sẽ lưu hồ sơ vào Talent Pool cho các vị trí phù hợp hơn..."
            className="w-full rounded-md border border-neutral-300 p-3 text-sm transition-colors outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <span className="self-end text-xs text-neutral-400">
            {customMessage.length}/{CUSTOM_MESSAGE_MAX_LENGTH} ký tự
          </span>
        </div>
      </div>
    </Modal>
  );
}
