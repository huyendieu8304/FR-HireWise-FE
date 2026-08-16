import { useContext } from 'react';
import { DialogContext } from '@/components/ui/ConfirmDialog/DialogProvider';

/**
 * Hook truy cập Confirm Dialog toàn cục. Xem `DialogProvider` để biết cách
 * dùng `confirm()`. Phải được gọi bên trong cây component nằm dưới
 * `<DialogProvider>` (đã bọc sẵn ở `src/app/AppProviders.tsx`).
 */
export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog() phải được gọi bên trong <DialogProvider>.');
  }
  return ctx;
}
