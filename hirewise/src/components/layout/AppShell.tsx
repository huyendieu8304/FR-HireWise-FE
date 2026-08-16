import { NavLink, Outlet } from 'react-router-dom';
import {
  Briefcase,
  ChartBar,
  Kanban,
  PuzzlePiece,
  SquaresFour,
} from '@phosphor-icons/react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/useAuthStore';
import { getInitials } from '@/utils/formatters';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: SquaresFour },
  { to: ROUTES.JOBS, label: 'Vị trí tuyển dụng', icon: Briefcase },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/reports', label: 'Báo cáo', icon: ChartBar },
  { to: ROUTES.COMPONENT_SHOWCASE, label: 'Component Showcase', icon: PuzzlePiece },
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
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-neutral-0 flex h-(--spacing-header) items-center justify-end gap-3 border-b border-neutral-200 px-6">
          <div className="flex items-center gap-2">
            <span className="bg-primary-100 text-primary-700 flex size-8 items-center justify-center rounded-full text-xs font-semibold">
              {getInitials(user?.name ?? 'HR')}
            </span>
            <span className="text-sm font-medium text-neutral-700">
              {user?.name ?? 'Người dùng'}
            </span>
          </div>
        </header>

        <main className="page-container flex-1 py-(--spacing-section)">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
