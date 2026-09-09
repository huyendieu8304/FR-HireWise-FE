import { useState } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/utils/cn';

const REASON_MAX_LENGTH = 500;

export interface JobLifecycleReasonModalProps {
  open: boolean;
  onClose: () => void;
  /** Tiêu đề Confirm Modal, vd "Tạm dừng vị trí tuyển dụng?" */
  title: string;
  /** Câu giải thích hệ quả của hành động, hiện ngay dưới tiêu đề. */
  description: string;
  /** Nhãn nút xác nhận, vd "Tạm dừng" / "Đóng vị trí". */
  confirmLabel: string;
  /** `danger` cho [Đóng vị trí] (không thể hoàn tác), `default` cho [Tạm dừng]. */
  tone?: 'default' | 'danger';
  /** Dòng cảnh báo in đậm, chỉ dùng cho hành động không thể hoàn tác. */
  warning?: string;
  isPending: boolean;
  onConfirm: (reason?: string) => void;
}

/**
 * UC-44 bước 2 — Confirm Modal cho [Tạm dừng] và [Đóng vị trí], kèm ô nhập
 * lý do (tuỳ chọn).
 *
 * Không dùng `useDialog().confirm()` như chỗ khác trong app vì
 * `ConfirmDialog` chỉ nhận `description` dạng text, không có children slot
 * nên không nhét được textarea. Cũng như modal Từ chối ở `ApprovalDetailPage`,
 * ô nhập là `<textarea>` thô — bộ `components/ui` hiện chưa có TextArea.
 */
export function JobLifecycleReasonModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  tone = 'default',
  warning,
  isPending,
  onConfirm,
}: JobLifecycleReasonModalProps) {
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => !isPending && handleClose()}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            isLoading={isPending}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {warning && (
          <p className="bg-danger-50 text-danger-700 rounded-md px-3 py-2 text-sm font-semibold">
            {warning}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="job-lifecycle-reason"
            className="text-sm font-medium text-neutral-800"
          >
            Lý do <span className="font-normal text-neutral-500">(không bắt buộc)</span>
          </label>
          <textarea
            id="job-lifecycle-reason"
            rows={3}
            maxLength={REASON_MAX_LENGTH}
            value={reason}
            disabled={isPending}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ví dụ: đã tuyển đủ chỉ tiêu, đang xử lý backlog hồ sơ hiện có..."
            className={cn(
              'w-full rounded-md border p-3 text-sm transition-colors outline-none focus:ring-2',
              'focus:border-primary-500 focus:ring-primary-500/20 border-neutral-300',
              'disabled:cursor-not-allowed disabled:bg-neutral-50',
            )}
          />
          <p className="text-xs text-neutral-500">
            Lý do chỉ được lưu vào nhật ký hệ thống để tra cứu, không gửi cho ứng viên.{' '}
            {reason.length}/{REASON_MAX_LENGTH}
          </p>
        </div>
      </div>
    </Modal>
  );
}
