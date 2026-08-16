import { Component, type ErrorInfo, type ReactNode } from 'react';
import { WarningOctagon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Bắt lỗi runtime JS xảy ra trong quá trình render (lỗi mà try/catch thông
 * thường và interceptor axios KHÔNG bắt được, vì chúng xảy ra trong React
 * render tree, ví dụ: đọc `undefined.property`, lỗi component con throw).
 *
 * Đặt ở gốc app (`src/app/AppProviders.tsx`) để tránh toàn bộ ứng dụng bị
 * "màn hình trắng chết" khi có lỗi không lường trước — thay vào đó hiển thị
 * fallback UI thân thiện kèm nút thử lại.
 *
 * Lưu ý: đây là React Error Boundary — chỉ hoạt động với LỖI RENDER, không
 * bắt được lỗi trong event handler hay code async (những chỗ đó tự try/catch
 * và gọi `useNotification().error(...)`).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Nơi tích hợp công cụ theo dõi lỗi (Sentry, LogRocket...) sau này.
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-50 p-6 text-center">
          <WarningOctagon weight="fill" className="text-danger-500 size-12" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Đã có lỗi xảy ra</h1>
            <p className="mt-1 max-w-md text-sm text-neutral-500">
              Ứng dụng gặp sự cố ngoài dự kiến. Vui lòng thử tải lại trang; nếu lỗi vẫn
              tiếp diễn, hãy liên hệ đội kỹ thuật.
            </p>
          </div>
          <Button onClick={this.handleReset}>Tải lại trang</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
