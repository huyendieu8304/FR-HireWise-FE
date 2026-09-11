import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Link as LinkIcon,
  VideoCamera,
  Buildings,
  Copy,
  Check,
  Plus,
  Trash,
  Clock,
  Sparkle,
  WarningCircle,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { getAvailableInterviewers, getInterviewerBusySlots } from '@/features/kanban/api/interviewApi';
import { sendBookingLink } from '../api/bookingApi';
import type { InterviewMode } from '@/features/kanban/types';
import type { BookingRequestResponse, SlotItem } from '../types';

export interface SendBookingLinkModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  targetStageId?: number;
  onSent?: () => void;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function SendBookingLinkModal({
  open,
  onClose,
  applicationId,
  candidateName,
  targetStageId,
  onSent,
}: SendBookingLinkModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  // Date calculation: tomorrow to 5 days later
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  }, []);

  // Form State
  const [interviewerId, setInterviewerId] = useState<number | ''>('');
  const [mode, setMode] = useState<InterviewMode>('ONLINE');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState(tomorrow);
  const [dateRangeEnd, setDateRangeEnd] = useState(defaultEnd);
  const [timeRangeStart, setTimeRangeStart] = useState('08:30');
  const [timeRangeEnd, setTimeRangeEnd] = useState('17:00');
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotDateInput, setSlotDateInput] = useState(tomorrow);
  const [slotTimeInput, setSlotTimeInput] = useState('09:00');

  // Success state: show link created
  const [result, setResult] = useState<BookingRequestResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Available interviewers
  const { data: interviewers = [], isLoading: isLoadingInterviewers } = useQuery({
    queryKey: ['interviewers', 'available'],
    queryFn: getAvailableInterviewers,
    enabled: open,
  });

  const interviewerOptions = useMemo(
    () =>
      interviewers.map((i) => ({
        value: String(i.id),
        label: `${i.fullName} (${i.email})`,
      })),
    [interviewers]
  );

  // Interviewer busy slots
  const { data: busySlots = [] } = useQuery({
    queryKey: ['interviewer-busy-slots', interviewerId, dateRangeStart, dateRangeEnd],
    queryFn: () =>
      getInterviewerBusySlots(
        Number(interviewerId),
        dateRangeStart,
        dateRangeEnd,
      ),
    enabled:
      open &&
      Boolean(interviewerId) &&
      Boolean(dateRangeStart) &&
      Boolean(dateRangeEnd),
  });

  const busySlotKeys = useMemo(() => {
    const set = new Set<string>();
    for (const b of busySlots) {
      const normalizedTime = b.time.substring(0, 5); // "HH:mm"
      set.add(`${b.date} ${normalizedTime}`);
    }
    return set;
  }, [busySlots]);

  const conflictingSlots = useMemo(() => {
    return slots.filter((s) => busySlotKeys.has(`${s.slotDate} ${s.slotTime}`));
  }, [slots, busySlotKeys]);

  // Auto-generate preset slots for all dates in range with interviewer conflict filtering
  const handleAutoGenerateSlots = async () => {
    if (!dateRangeStart || !dateRangeEnd) return;
    const start = new Date(dateRangeStart);
    const end = new Date(dateRangeEnd);
    if (end < start) {
      notify.error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    const startMin = parseTimeToMinutes(timeRangeStart || '08:30');
    const endMin = parseTimeToMinutes(timeRangeEnd || '17:00');
    if (endMin <= startMin) {
      notify.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    // Check interviewer busy slots
    const busySet = new Set(busySlotKeys);
    if (interviewerId && busySet.size === 0) {
      try {
        const fetched = await getInterviewerBusySlots(
          Number(interviewerId),
          dateRangeStart,
          dateRangeEnd,
        );
        for (const b of fetched) {
          busySet.add(`${b.date} ${b.time.substring(0, 5)}`);
        }
      } catch {
        // Non-blocking
      }
    }

    const generated: SlotItem[] = [];
    let conflictsCount = 0;
    const curr = new Date(start);
    const stepMinutes = 60; // 1-hour interval between slots

    while (curr <= end) {
      // Skip weekends (Sunday = 0, Saturday = 6)
      const day = curr.getDay();
      if (day !== 0 && day !== 6) {
        const dateStr = curr.toISOString().split('T')[0];
        let curMin = startMin;
        while (curMin + 30 <= endMin) {
          // Skip lunch break 12:00 - 13:30
          if (curMin >= 720 && curMin < 810) {
            curMin = 810;
            if (curMin + 30 > endMin) break;
          }
          const timeStr = formatMinutesToTime(curMin);
          if (busySet.has(`${dateStr} ${timeStr}`)) {
            conflictsCount++;
          }
          generated.push({ slotDate: dateStr, slotTime: timeStr, durationMinutes: 45 });
          curMin += stepMinutes;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (generated.length === 0) {
      notify.error('Không tìm thấy ngày làm việc hợp lệ trong khoảng thời gian đã chọn.');
      return;
    }

    setSlots(generated);
    if (conflictsCount > 0) {
      notify.success(
        `Đã tự động tạo ${generated.length} khung giờ (trong đó có ${conflictsCount} khung giờ trùng lịch sẽ tự động bôi xám khi ứng viên mở link).`
      );
    } else {
      notify.success(`Đã tự động tạo ${generated.length} khung giờ có sẵn cho các ngày làm việc.`);
    }
  };

  const handleAddSlot = () => {
    if (!slotDateInput || !slotTimeInput) return;
    const exists = slots.some(
      (s) => s.slotDate === slotDateInput && s.slotTime === slotTimeInput
    );
    if (exists) {
      notify.error('Khung giờ này đã được thêm.');
      return;
    }
    if (busySlotKeys.has(`${slotDateInput} ${slotTimeInput}`)) {
      notify.info('Khung giờ này trùng lịch phỏng vấn của Interviewer và sẽ được bôi xám trên trang của ứng viên.');
    }
    setSlots((prev) => [
      ...prev,
      { slotDate: slotDateInput, slotTime: slotTimeInput, durationMinutes: 45 },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveConflictingSlots = () => {
    setSlots((prev) =>
      prev.filter((s) => !busySlotKeys.has(`${s.slotDate} ${s.slotTime}`))
    );
    notify.info('Đã xoá tất cả các khung giờ bị trùng lịch.');
  };

  const sendMutation = useMutation({
    mutationFn: () =>
      sendBookingLink(applicationId, {
        interviewerId: Number(interviewerId),
        dateRangeStart,
        dateRangeEnd,
        targetStageId,
        mode,
        locationOrLink: locationOrLink.trim() || undefined,
        slots,
      }),
    onSuccess: (data) => {
      setResult(data);
      notify.success('Đã tạo liên kết và gửi email EM-06 cho ứng viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
      onSent?.();
    },
    onError: (error) => {
      notify.error(error);
    },
  });

  const handleCopyLink = () => {
    if (result?.bookingLink) {
      navigator.clipboard.writeText(result.bookingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setResult(null);
    setCopied(false);
    onClose();
  };

  const isFormValid =
    interviewerId !== '' &&
    Boolean(dateRangeStart) &&
    Boolean(dateRangeEnd) &&
    slots.length > 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Gửi liên kết tự chọn lịch phỏng vấn (Self-service Booking)"
      size="lg"
    >
      {result ? (
        /* Result Screen */
        <div className="space-y-5 py-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="size-6" weight="bold" />
            </div>
            <h3 className="text-base font-bold text-emerald-900">
              Đã gửi liên kết thành công!
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Hệ thống đã tự động gửi email mời (EM-06) kèm liên kết này tới ứng viên <strong>{candidateName}</strong>.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 mb-1 block">
              Liên kết đặt lịch phỏng vấn (Thời hạn 7 ngày):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.bookingLink}
                className="flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-mono text-neutral-800 select-all"
              />
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="size-4 mr-1 text-emerald-600" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-1" />
                    <span>Sao chép</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500 border border-neutral-100">
            Tổng cộng: <strong>{result.totalSlots} khung giờ</strong> phỏng vấn khả dụng cùng <strong>{result.interviewerName}</strong>.
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>Hoàn tất</Button>
          </div>
        </div>
      ) : (
        /* Booking Configuration Form */
        <div className="space-y-4 py-2">
          <p className="text-xs text-neutral-500">
            Tự động hóa xếp lịch: Ứng viên <strong>{candidateName}</strong> sẽ nhận email chứa liên kết để tự chọn một khung giờ phù hợp từ danh sách bạn chỉ định dưới đây.
          </p>

          {/* Interviewer Selector */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 mb-1 block">
              Người phỏng vấn (Interviewer) <span className="text-red-500">*</span>
            </label>
            <Select
              options={interviewerOptions}
              value={interviewerId === '' ? '' : String(interviewerId)}
              onChange={(e) => setInterviewerId(e.target.value ? Number(e.target.value) : '')}
              placeholder={
                isLoadingInterviewers
                  ? 'Đang tải danh sách người phỏng vấn...'
                  : 'Chọn người phỏng vấn...'
              }
              disabled={isLoadingInterviewers}
            />
          </div>

          {/* Mode & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Hình thức phỏng vấn
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('ONLINE')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all ${
                    mode === 'ONLINE'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <VideoCamera className="size-4 text-emerald-600" />
                  <span>Trực tuyến</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('ONSITE')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all ${
                    mode === 'ONSITE'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Buildings className="size-4 text-primary-600" />
                  <span>Trực tiếp</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                {mode === 'ONLINE' ? 'Link phòng họp (tùy chọn)' : 'Địa điểm phòng họp'}
              </label>
              <input
                type="text"
                placeholder={
                  mode === 'ONLINE'
                    ? 'Để trống để hệ thống tự tạo Google Meet'
                    : 'Phòng họp tầng 3, Tòa nhà FPT...'
                }
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-2 text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Time Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Khoảng ngày từ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={tomorrow}
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Đến ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={dateRangeStart || tomorrow}
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Thời gian từ
              </label>
              <input
                type="time"
                value={timeRangeStart}
                onChange={(e) => setTimeRangeStart(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Đến thời gian
              </label>
              <input
                type="time"
                value={timeRangeEnd}
                onChange={(e) => setTimeRangeEnd(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-800"
              />
            </div>
          </div>

          {/* Slots Management */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                Các khung giờ mở cho ứng viên chọn ({slots.length} slots)
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAutoGenerateSlots}
                className="text-xs h-7"
              >
                <Sparkle className="size-3.5 mr-1 text-primary-600" weight="fill" />
                Tự động tạo các ngày trong khoảng
              </Button>
            </div>

            {/* Manual Slot Add Row */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                min={dateRangeStart}
                max={dateRangeEnd}
                value={slotDateInput}
                onChange={(e) => setSlotDateInput(e.target.value)}
                className="text-xs rounded-lg border border-neutral-300 px-2.5 py-1.5 bg-white text-neutral-800"
              />
              <input
                type="time"
                value={slotTimeInput}
                onChange={(e) => setSlotTimeInput(e.target.value)}
                className="text-xs rounded-lg border border-neutral-300 px-2.5 py-1.5 bg-white text-neutral-800"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddSlot}
                className="h-8 shrink-0"
              >
                <Plus className="size-3.5 mr-1" />
                Thêm slot
              </Button>
            </div>

            {/* Conflict information banner */}
            {conflictingSlots.length > 0 && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <WarningCircle className="size-4 shrink-0 text-amber-600" weight="fill" />
                  <span>
                    Có <b>{conflictingSlots.length} khung giờ</b> trùng lịch phỏng vấn của Interviewer. Các khung giờ này vẫn sẽ được gửi nhưng sẽ tự động <b>bôi xám (không cho chọn)</b> khi ứng viên mở link.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveConflictingSlots}
                  className="shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                  Xoá các slot trùng
                </button>
              </div>
            )}

            {/* Slots List */}
            {slots.length > 0 ? (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {slots.map((s, idx) => {
                  const isConflicted = busySlotKeys.has(`${s.slotDate} ${s.slotTime}`);
                  return (
                    <div
                      key={`${s.slotDate}-${s.slotTime}-${idx}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 border text-xs transition-colors ${
                        isConflicted
                          ? 'border-amber-300 bg-amber-50/70 text-amber-900'
                          : 'border-neutral-200 bg-white text-neutral-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className={`size-3.5 ${isConflicted ? 'text-amber-500' : 'text-primary-600'}`} />
                        <strong>{s.slotDate}</strong> vào lúc{' '}
                        <strong className={isConflicted ? 'text-amber-800' : ''}>{s.slotTime}</strong>
                        {isConflicted && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            Bôi xám
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(idx)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        title="Xóa khung giờ"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-3 text-xs text-neutral-400">
                Chưa có khung giờ nào được tạo. Nhấn "Tự động tạo" hoặc thêm thủ công bên trên.
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <div className="text-xs">
              <span className="text-neutral-500">Đã tạo: </span>
              <strong className="text-primary-700">{slots.length} khung giờ</strong>
              {conflictingSlots.length > 0 && (
                <span className="ml-2 font-medium text-amber-700">
                  ({conflictingSlots.length} slot sẽ bôi xám)
                </span>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={sendMutation.isPending}>
                Hủy
              </Button>
              <Button
                onClick={() => sendMutation.mutate()}
                isLoading={sendMutation.isPending}
                disabled={!isFormValid || sendMutation.isPending}
              >
                <LinkIcon className="mr-1.5 size-4" weight="bold" />
                Gửi liên kết cho ứng viên
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
