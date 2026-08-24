import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from '@phosphor-icons/react';
import { Drawer } from '@/components/ui/Drawer/Drawer';
import { Button } from '@/components/ui/Button/Button';
import { Select } from '@/components/ui/Select/Select';
import { Switch } from '@/components/ui/Switch/Switch';
import { Badge } from '@/components/ui/Badge/Badge';
import { cn } from '@/utils/cn';
import { useNotification } from '@/hooks/useNotification';
import {
  assignAccessScope,
  assignRole,
  listAccessScopes,
  listDepartments,
  listJobs,
  revokeRole,
} from '../api/usersApi';
import {
  ALL_ROLES,
  ROLE_LABELS,
  type AccessScopeType,
  type Role,
  type UserAccount,
} from '../types';

export interface PermissionDrawerProps {
  user: UserAccount | null;
  onClose: () => void;
}

interface PendingScope {
  key: string;
  scopeType: AccessScopeType;
  departmentId?: number;
  jobId?: string;
  includeSubDepartments: boolean;
  canWrite: boolean;
}

const SCOPE_OPTIONS: { value: AccessScopeType; label: string }[] = [
  { value: 'SYSTEM', label: 'Toàn hệ thống' },
  { value: 'DEPARTMENT', label: 'Theo phòng ban' },
  { value: 'JOB', label: 'Theo Job cụ thể' },
];

/**
 * UC-03: gán Role hệ thống + Access Scope (BR-RBAC-05/06/07).
 *
 * Backend model hóa role và access scope khác nhau:
 * - Role: `POST .../roles` (gán) + `DELETE .../roles/{code}` (thu hồi) —
 *   nên component này DIFF role hiện tại vs role đã chọn rồi gọi từng API
 *   tương ứng, không có endpoint "set nguyên mảng role" 1 lần.
 * - Access scope: chỉ có `POST .../access-scopes` (tạo dòng mới) +
 *   `GET .../access-scopes` (xem) — CHƯA có endpoint sửa/xóa 1 dòng đã lưu,
 *   nên scope cũ hiển thị READ-ONLY, phần tương tác chỉ để thêm dòng mới.
 *
 * Không dùng react-hook-form vì UI có danh sách động (nhiều dòng scope chờ
 * thêm) — quản lý bằng state cục bộ, validate thủ công trước khi submit.
 */
export function PermissionDrawer({ user, onClose }: PermissionDrawerProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  });
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: listJobs });
  const { data: existingScopes = [] } = useQuery({
    queryKey: ['access-scopes', user?.id],
    queryFn: () => listAccessScopes(user!.id),
    enabled: user !== null,
  });

  // Khởi tạo từ `user` bằng lazy initializer — nơi gọi (UserManagementPage)
  // đặt `key={user?.id}` nên mỗi lần mở drawer cho user khác, React remount
  // lại toàn bộ, state luôn khớp đúng user hiện tại (không cần useEffect
  // "derive state from props").
  const [roles, setRoles] = useState<Role[]>(() => user?.roleCodes ?? []);
  const [pendingScopes, setPendingScopes] = useState<PendingScope[]>([]);
  const [draftScopeType, setDraftScopeType] = useState<AccessScopeType>('DEPARTMENT');
  const [draftDepartmentId, setDraftDepartmentId] = useState('');
  const [draftJobId, setDraftJobId] = useState('');
  const [draftIncludeSub, setDraftIncludeSub] = useState(true);
  const [draftCanWrite, setDraftCanWrite] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const originalRoles = user.roleCodes;
      const rolesToAdd = roles.filter((r) => !originalRoles.includes(r));
      const rolesToRemove = originalRoles.filter((r) => !roles.includes(r));

      await Promise.all([
        ...rolesToAdd.map((role) => assignRole(user.id, role)),
        ...rolesToRemove.map((role) => revokeRole(user.id, role)),
        ...pendingScopes.map((scope) =>
          assignAccessScope(user.id, {
            scopeType: scope.scopeType,
            departmentId: scope.departmentId,
            jobId: scope.jobId,
            includeSubDepartments: scope.includeSubDepartments,
            canWrite: scope.canWrite,
          }),
        ),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['access-scopes', user?.id] });
      notify.success('Đã lưu phân quyền.');
      onClose();
    },
    onError: (error) => notify.error(error),
  });

  function toggleRole(role: Role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function addPendingScope() {
    if (draftScopeType === 'DEPARTMENT' && !draftDepartmentId) {
      setFormError('Chọn phòng ban trước khi thêm.');
      return;
    }
    if (draftScopeType === 'JOB' && !draftJobId) {
      setFormError('Chọn Job trước khi thêm.');
      return;
    }
    setFormError(null);
    setPendingScopes((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        scopeType: draftScopeType,
        departmentId:
          draftScopeType === 'DEPARTMENT' ? Number(draftDepartmentId) : undefined,
        jobId: draftScopeType === 'JOB' ? draftJobId : undefined,
        includeSubDepartments: draftIncludeSub,
        canWrite: draftCanWrite,
      },
    ]);
    setDraftDepartmentId('');
    setDraftJobId('');
    setDraftIncludeSub(true);
    setDraftCanWrite(false);
  }

  function removePendingScope(key: string) {
    setPendingScopes((prev) => prev.filter((s) => s.key !== key));
  }

  function handleSubmit() {
    if (roles.length === 0) {
      setFormError('Chọn ít nhất 1 vai trò.');
      return;
    }
    setFormError(null);
    saveMutation.mutate();
  }

  function scopeLabel(scope: {
    scopeType: AccessScopeType;
    departmentId?: number | null;
    jobId?: string | null;
  }) {
    if (scope.scopeType === 'SYSTEM') return 'Toàn hệ thống';
    if (scope.scopeType === 'DEPARTMENT') {
      const dept = departments.find((d) => d.id === scope.departmentId);
      return dept?.name ?? `Phòng ban #${scope.departmentId}`;
    }
    const job = jobs.find((j) => j.id === scope.jobId);
    return job?.title ?? `Job #${scope.jobId}`;
  }

  return (
    <Drawer
      open={user !== null}
      onClose={onClose}
      title={user ? `Phân quyền — ${user.fullName}` : ''}
      description={user?.email}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} isLoading={saveMutation.isPending}>
            Lưu phân quyền
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {formError && (
          <p role="alert" className="text-danger-600 text-xs">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-700">Vai trò hệ thống</span>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((role) => {
              const selected = roles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-secondary-600 bg-secondary-100 text-secondary-700'
                      : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50',
                  )}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-700">
            Access scope hiện tại
          </span>
          {existingScopes.length === 0 && pendingScopes.length === 0 && (
            <p className="text-xs text-neutral-400">Chưa có access scope nào.</p>
          )}
          {existingScopes.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
              {existingScopes.map((scope) => (
                <div
                  key={scope.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{scopeLabel(scope)}</Badge>
                    {scope.canWrite && <Badge variant="info">Có thể sửa</Badge>}
                  </div>
                  <span className="text-xs text-neutral-400">Đã lưu</span>
                </div>
              ))}
            </div>
          )}
          {pendingScopes.length > 0 && (
            <div className="border-primary-100 bg-primary-50 flex flex-col gap-2 rounded-md border p-3">
              {pendingScopes.map((scope) => (
                <div
                  key={scope.key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{scopeLabel(scope)}</Badge>
                    {scope.canWrite && <Badge variant="info">Có thể sửa</Badge>}
                    <span className="text-primary-700 text-xs">Chưa lưu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingScope(scope.key)}
                    className="hover:text-danger-600 text-xs font-medium text-neutral-500"
                  >
                    Bỏ
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-neutral-400">
            Chưa hỗ trợ xóa access scope đã lưu (backend chưa có API) — chỉ có thể thêm
            mới.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-dashed border-neutral-300 p-3">
          <span className="text-sm font-medium text-neutral-700">
            Thêm access scope mới
          </span>

          <div className="flex flex-col gap-2">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-neutral-700"
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border',
                    draftScopeType === opt.value
                      ? 'border-primary-600'
                      : 'border-neutral-400',
                  )}
                >
                  {draftScopeType === opt.value && (
                    <span className="bg-primary-600 size-2 rounded-full" />
                  )}
                </span>
                <input
                  type="radio"
                  name="draftScopeType"
                  className="sr-only"
                  checked={draftScopeType === opt.value}
                  onChange={() => setDraftScopeType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>

          {draftScopeType === 'DEPARTMENT' && (
            <Select
              placeholder="Chọn phòng ban"
              value={draftDepartmentId}
              onChange={(e) => setDraftDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
            />
          )}
          {draftScopeType === 'JOB' && (
            <Select
              placeholder={
                jobs.length === 0 ? 'Chưa có Job nào (chưa có API)' : 'Chọn Job'
              }
              value={draftJobId}
              onChange={(e) => setDraftJobId(e.target.value)}
              options={jobs.map((j) => ({ value: j.id, label: j.title }))}
              disabled={jobs.length === 0}
            />
          )}

          {draftScopeType === 'DEPARTMENT' && (
            <label className="flex items-center justify-between text-sm text-neutral-700">
              Bao gồm phòng ban con
              <Switch
                size="sm"
                checked={draftIncludeSub}
                onChange={setDraftIncludeSub}
                label="Bao gồm phòng ban con"
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <span
              className={cn(
                'flex size-4 items-center justify-center rounded border',
                draftCanWrite
                  ? 'border-primary-600 bg-primary-600'
                  : 'bg-neutral-0 border-neutral-300',
              )}
            >
              {draftCanWrite && <Check weight="bold" className="size-3 text-white" />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={draftCanWrite}
              onChange={(e) => setDraftCanWrite(e.target.checked)}
            />
            Cho phép chỉnh sửa (can_write) trong phạm vi này
          </label>

          <Button type="button" variant="outline" size="sm" onClick={addPendingScope}>
            <Plus className="size-4" />
            Thêm vào danh sách chờ lưu
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
