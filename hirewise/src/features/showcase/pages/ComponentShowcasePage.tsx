import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { Select } from '@/components/ui/Select/Select';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';
import { useNotification } from '@/hooks/useNotification';
import { useDialog } from '@/hooks/useDialog';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  slugify,
  truncate,
} from '@/utils/formatters';

interface ShowcaseForm {
  jobTitle: string;
  salary: number | null;
  department: string;
  deadline: string;
}

const DEPARTMENT_OPTIONS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'Human Resources' },
];

/**
 * Trang tham chiếu nội bộ (không thuộc nghiệp vụ ATS) — demo trực quan toàn
 * bộ Reusable Input Components, Notification, Confirm Dialog và Formatters
 * đã dựng ở tầng nền tảng. Dùng để dev mới xem code mẫu nhanh thay vì đọc
 * GUIDE.md không có ví dụ chạy được.
 */
export function ComponentShowcasePage() {
  const notify = useNotification();
  const { confirm } = useDialog();
  const [confirmResult, setConfirmResult] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);
  const fiveMinutesAgo = useMemo(() => now.getTime() - 5 * 60 * 1000, [now]);

  const { register, control, handleSubmit } = useForm<ShowcaseForm>({
    defaultValues: { jobTitle: '', salary: null, department: '', deadline: '' },
  });

  async function handleDangerousAction() {
    const ok = await confirm({
      title: 'Xóa vị trí tuyển dụng?',
      description:
        'Hành động này không thể hoàn tác. Toàn bộ hồ sơ ứng viên liên quan sẽ bị gỡ khỏi pipeline.',
      confirmLabel: 'Xóa',
      tone: 'danger',
    });
    setConfirmResult(ok ? 'Đã xác nhận xóa.' : 'Đã hủy thao tác.');
  }

  return (
    <div className="flex flex-col gap-10 pb-10">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Component Showcase</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tham chiếu trực quan cho bộ component nền tảng — xem GUIDE.md để biết chi tiết
          API.
        </p>
      </div>

      {/* ---------------- Form Inputs ---------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">Form Inputs</h2>
        <form
          onSubmit={handleSubmit((values) =>
            notify.success(`Đã submit: ${JSON.stringify(values)}`),
          )}
          className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <TextInput
            label="Chức danh"
            placeholder="Senior Backend Engineer"
            prefixIcon={<MagnifyingGlass />}
            helperText="Tên vị trí tuyển dụng"
            {...register('jobTitle')}
          />

          <Controller
            name="salary"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Mức lương"
                currencySymbol="₫"
                placeholder="15.000.000"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Select
            label="Phòng ban"
            placeholder="Chọn phòng ban"
            options={DEPARTMENT_OPTIONS}
            {...register('department')}
          />

          <DatePicker label="Hạn nộp hồ sơ" mode="date" {...register('deadline')} />

          <Button type="submit" className="w-fit sm:col-span-2">
            Submit form mẫu
          </Button>
        </form>
      </section>

      {/* ---------------- Buttons ---------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* ---------------- Notification ---------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Notification (useNotification)
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => notify.success('Đã lưu thành công!')}>
            Toast Success
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.error('Không thể kết nối máy chủ.')}
          >
            Toast Error
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.warning('Slot phỏng vấn sắp hết hạn.')}
          >
            Toast Warning
          </Button>
          <Button
            variant="outline"
            onClick={() => notify.info('Đã đồng bộ 5 hồ sơ mới.')}
          >
            Toast Info
          </Button>
        </div>
      </section>

      {/* ---------------- Confirm Dialog ---------------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Confirm Dialog (useDialog)
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={handleDangerousAction}>
            Xóa vị trí (demo)
          </Button>
          {confirmResult && (
            <span className="text-sm text-neutral-500">{confirmResult}</span>
          )}
        </div>
      </section>

      {/* ---------------- Formatters ---------------- */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Formatters</h2>
        <ul className="space-y-1 text-sm text-neutral-600">
          <li>formatCurrency(18000000, 'VND') → {formatCurrency(18_000_000, 'VND')}</li>
          <li>formatDate(new Date()) → {formatDate(now)}</li>
          <li>formatRelativeTime(5 phút trước) → {formatRelativeTime(fiveMinutesAgo)}</li>
          <li>
            truncate('Senior Backend Engineer (Java/Spring)', 24) →{' '}
            {truncate('Senior Backend Engineer (Java/Spring)', 24)}
          </li>
          <li>
            slugify('Kỹ sư Backend (Java/Spring)') →{' '}
            {slugify('Kỹ sư Backend (Java/Spring)')}
          </li>
        </ul>
      </section>
    </div>
  );
}
