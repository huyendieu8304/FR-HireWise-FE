import { Outlet } from 'react-router-dom';

/**
 * Layout khung cho khu vực CÔNG KHAI hướng tới ứng viên (candidate-facing):
 * trang tin tuyển dụng, form ứng tuyển, ký offer điện tử. Tối giản hơn
 * AppShell — không sidebar, không yêu cầu đăng nhập nội bộ.
 */
export function PublicLayout() {
  return (
    <div className="bg-neutral-0 flex min-h-dvh flex-col">
      <header className="border-b border-neutral-200">
        <div className="page-container flex h-(--spacing-header) items-center">
          <span className="text-lg font-bold text-neutral-900">HireWise</span>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 py-6">
        <div className="page-container text-sm text-neutral-500">
          © {new Date().getFullYear()} HireWise. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
