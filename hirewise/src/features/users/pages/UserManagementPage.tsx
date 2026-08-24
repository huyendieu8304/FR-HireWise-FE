import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlass, Plus, UsersThree } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { Switch } from '@/components/ui/Switch/Switch';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useDialog } from '@/hooks/useDialog';
import { useNotification } from '@/hooks/useNotification';
import { formatDate, getInitials } from '@/utils/formatters';
import { listDepartments, listUsers, updateUserStatus } from '../api/usersApi';
import { ROLE_LABELS, type UserAccount, type UserStatus } from '../types';
import { AddUserModal } from '../components/AddUserModal';
import { PermissionDrawer } from '../components/PermissionDrawer';

const STATUS_FILTER_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DISABLED', label: 'Disabled' },
];

const STATUS_BADGE_VARIANT: Record<
  UserStatus,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  BLOCKED: 'danger',
  DISABLED: 'neutral',
};

/**
 * UC-02: danh sách + tìm kiếm/lọc + khóa-mở khóa tài khoản nội bộ.
 * UC-03: mở drawer phân quyền (role + access scope) cho từng user.
 */
export function UserManagementPage() {
  const notify = useNotification();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState<UserAccount | null>(null);

  // TODO: trang hiện fetch 1 page lớn (size=100) thay vì phân trang thật —
  // đủ dùng khi số lượng user còn ít; thêm UI phân trang khi cần.
  const { data: userPage, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers({ size: 100 }),
  });
  // `?? []` tạo array mới mỗi render — memo hóa để không kích hoạt lại
  // useMemo bên dưới (phụ thuộc vào `users`) một cách không cần thiết.
  const users = useMemo(() => userPage?.content ?? [], [userPage]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: UserStatus }) =>
      updateUserStatus(userId, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success(
        updated.status === 'BLOCKED'
          ? `Đã khóa tài khoản ${updated.fullName}.`
          : `Đã mở khóa tài khoản ${updated.fullName}.`,
      );
    },
    onError: (error) => notify.error(error),
  });

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesKeyword =
        keyword === '' ||
        u.fullName.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword);
      const matchesDepartment =
        departmentFilter === '' || String(u.departmentId) === departmentFilter;
      const matchesStatus = statusFilter === '' || u.status === statusFilter;
      return matchesKeyword && matchesDepartment && matchesStatus;
    });
  }, [users, search, departmentFilter, statusFilter]);

  async function handleToggleStatus(user: UserAccount) {
    // Chỉ Active <-> Blocked theo Switch; Invited/Disabled không toggle qua đây.
    if (user.status === 'BLOCKED') {
      updateStatusMutation.mutate({ userId: user.id, status: 'ACTIVE' });
      return;
    }
    const ok = await confirm({
      title: `Khóa tài khoản ${user.fullName}?`,
      description:
        'Toàn bộ phiên đăng nhập đang hoạt động của tài khoản này sẽ bị thu hồi ngay lập tức.',
      confirmLabel: 'Khóa tài khoản',
      tone: 'danger',
    });
    if (ok) updateStatusMutation.mutate({ userId: user.id, status: 'BLOCKED' });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Quản lý người dùng nội bộ
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {userPage ? `${userPage.totalElements} tài khoản · ` : ''}Tạo mới, gán vai trò
            và phạm vi truy cập.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="size-4" />
          Thêm User mới
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <TextInput
          containerClassName="min-w-64 flex-1"
          placeholder="Tìm theo tên hoặc email..."
          prefixIcon={<MagnifyingGlass />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          containerClassName="w-52"
          placeholder="Tất cả phòng ban"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
        />
        <Select
          containerClassName="w-44"
          placeholder="Tất cả trạng thái"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_FILTER_OPTIONS}
        />
      </div>

      <div className="shadow-elevation-1 bg-neutral-0 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Người dùng
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Phòng ban
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Vai trò
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Trạng thái
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Ngày tạo
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                Phân quyền
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-none">
                  <td className="px-4 py-3" colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <UsersThree className="size-8" />
                    <p className="text-sm">Không tìm thấy tài khoản phù hợp.</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100 last:border-none"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary-100 text-primary-700 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {getInitials(user.fullName)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {user.departmentName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roleCodes.length === 0 ? (
                        <span className="text-xs text-neutral-400">Chưa gán</span>
                      ) : (
                        user.roleCodes.map((role) => (
                          <Badge key={role} variant="secondary">
                            {ROLE_LABELS[role]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_BADGE_VARIANT[user.status]}>
                        {user.status}
                      </Badge>
                      {(user.status === 'ACTIVE' || user.status === 'BLOCKED') && (
                        <Switch
                          size="sm"
                          checked={user.status === 'ACTIVE'}
                          onChange={() => handleToggleStatus(user)}
                          disabled={updateStatusMutation.isPending}
                          label={`Chuyển trạng thái tài khoản ${user.fullName}`}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPermissionTarget(user)}
                    >
                      Phân quyền
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <AddUserModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <PermissionDrawer
        key={permissionTarget?.id ?? 'none'}
        user={permissionTarget}
        onClose={() => setPermissionTarget(null)}
      />
    </div>
  );
}
