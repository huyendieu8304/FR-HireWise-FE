import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CaretDown,
  ChartBar,
  CloudArrowUp,
  Kanban,
  PuzzlePiece,
  SignOut,
  SquaresFour,
  UsersThree,
} from '@phosphor-icons/react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotification } from '@/hooks/useNotification';
import { getInitials } from '@/utils/formatters';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: SquaresFour },
  { to: ROUTES.JOBS, label: 'Vị trí tuyển dụng', icon: Briefcase },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/reports', label: 'Báo cáo', icon: ChartBar },
  { to: ROUTES.COMPONENT_SHOWCASE, label: 'Component Showcase', icon: PuzzlePiece },
];

const ADMIN_NAV_ITEMS = [
  { to: ROUTES.USERS, label: 'Người dùng & Phân quyền', icon: UsersThree },
  // UC-07/UC-08
  {
    to: ROUTES.SETTINGS_INTEGRATIONS,
    label: 'Tích hợp Cloud Storage',
    icon: CloudArrowUp,
  },
];

/**
 * Layout khung cho khu vực NỘI BỘ (HR Admin/Recruiter/Manager/Interviewer):
 * sidebar điều hướng cố định + topbar. Trang con render qua `<Outlet />`.
 *
 * Đây là ví dụ mẫu — mở rộng sidebar theo role thực tế (RBAC) khi build
 * feature `auth` đầy đủ.
 */
export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const notify = useNotification();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài — UC-01 logout không cần confirm dialog,
  // chỉ là 1 dropdown đơn giản trên avatar (chưa đủ chỗ dùng để tách thành
  // component Dropdown dùng chung — cân nhắc khi có nơi thứ 2 cần popover).
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  function handleLogout() {
    // UC-01 luồng chính bước 6-7: revoke session hiện tại, xóa token phía
    // client, quay về trang đăng nhập. Khi có backend thật, gọi thêm
    // http.post('/auth/logout') trước clearSession() để revoke phía server.
    clearSession();
    notify.info('Đã đăng xuất.');
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <aside className="bg-neutral-0 flex w-(--spacing-sidebar) shrink-0 flex-col border-r border-neutral-200">
        <div className="flex h-(--spacing-header) items-center px-6">
          <span className="text-lg font-bold text-neutral-900">HireWise</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
                  isActive && 'bg-primary-50 text-primary-700 hover:bg-primary-50',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}

          <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            Quản trị
          </p>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
                  isActive && 'bg-primary-50 text-primary-700 hover:bg-primary-50',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-neutral-0 flex h-(--spacing-header) items-center justify-end gap-3 border-b border-neutral-200 px-6">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-100"
            >
              <span className="bg-primary-100 text-primary-700 flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                {getInitials(user?.name ?? 'HR')}
              </span>
              <span className="text-sm font-medium text-neutral-700">
                {user?.name ?? 'Người dùng'}
              </span>
              <CaretDown className="size-3.5 text-neutral-400" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="shadow-elevation-3 bg-neutral-0 absolute top-full right-0 z-(--z-index-dropdown) mt-1 w-44 rounded-md border border-neutral-200 py-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <SignOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="page-container flex-1 py-(--spacing-section)">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
