import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' đổi màu nút xác nhận sang đỏ — dùng cho hành động phá hủy (xóa, từ chối...) */
  tone?: 'default' | 'danger';
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const DialogContext = createContext<DialogContextValue | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Đặt DUY NHẤT MỘT LẦN ở gốc app. Cung cấp `useDialog().confirm(...)` cho
 * mọi component — thay thế `window.confirm()` bằng modal có style riêng,
 * trả về Promise<boolean> để dùng với `await` như confirm gốc.
 *
 * @example
 * const { confirm } = useDialog();
 * const ok = await confirm({ title: 'Xóa vị trí tuyển dụng?', tone: 'danger' });
 * if (ok) deleteJob();
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function handleClose(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        open={pending !== null}
        onClose={() => handleClose(false)}
        title={pending?.title}
        description={pending?.description}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {pending?.cancelLabel ?? 'Hủy'}
            </Button>
            <Button
              variant={pending?.tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => handleClose(true)}
              autoFocus
            >
              {pending?.confirmLabel ?? 'Xác nhận'}
            </Button>
          </>
        }
      >
        {/* Nội dung chính đã nằm ở `description` trên header; children để trống cho case đơn giản */}
        <span className="sr-only">Hộp thoại xác nhận</span>
      </Modal>
    </DialogContext.Provider>
  );
}
