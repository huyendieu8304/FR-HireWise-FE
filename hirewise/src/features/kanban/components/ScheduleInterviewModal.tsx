import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  VideoCamera,
  Buildings,
  Check,
  CaretLeft,
  CaretRight,
  Clock,
  Copy,
  CalendarBlank,
  Table,
  X,
  MagnifyingGlass,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import {
  getAvailableInterviewers,
  getInterviewCalendar,
  scheduleInterview,
} from '../api/interviewApi';
import type { InterviewMode, ScheduleInterviewRequest } from '../types';

export interface ScheduleInterviewModalProps {
  open: boolean;
  applicationId: string;
  candidateName: string;
  targetStageId: number;
  targetStageName: string;
  onClose: () => void;
  onSkip: () => void;
  onScheduled: () => void;
}

// Preset slots (giống ảnh Calendly/Google Appointment)
const MORNING_SLOTS = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const ALL_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export function ScheduleInterviewModal({
  open,
  applicationId,
  candidateName,
  targetStageId,
  targetStageName,
  onClose,
  onSkip,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const notify = useNotification();

  // Active view tab: 'SLOTS' (ảnh 1) hoặc 'WEEK_GRID' (ảnh 2)
  const [activeTab, setActiveTab] = useState<'SLOTS' | 'WEEK_GRID'>('SLOTS');

  // Form states
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<number[]>([]);
  const [mode, setMode] = useState<InterviewMode>('ONLINE');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [locationOrLink, setLocationOrLink] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Selected date & time
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  // Mini Calendar browsing month
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Week Grid navigation: start of the currently viewed week (Monday)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  // Calculate week end (Sunday)
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [weekStart]);

  // Load active interviewers
  const { data: interviewers = [], isLoading: isLoadingInterviewers } = useQuery({
    queryKey: ['available-interviewers'],
    queryFn: getAvailableInterviewers,
    enabled: open,
  });

  // Autocomplete states for interviewer selection
  const [interviewerSearch, setInterviewerSearch] = useState('');
  const [isInterviewerDropdownOpen, setIsInterviewerDropdownOpen] = useState(false);

  const filteredInterviewers = useMemo(() => {
    const term = interviewerSearch.trim().toLowerCase();
    return interviewers
      .filter((u) => !selectedInterviewerIds.includes(u.id))
      .filter(
        (u) =>
          !term ||
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.departmentName && u.departmentName.toLowerCase().includes(term)),
      );
  }, [interviewers, selectedInterviewerIds, interviewerSearch]);

  const selectedInterviewers = useMemo(() => {
    return interviewers.filter((u) => selectedInterviewerIds.includes(u.id));
  }, [interviewers, selectedInterviewerIds]);


  // Load calendar schedule for current week
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['interview-calendar', weekStartStr, weekEndStr],
    queryFn: () => getInterviewCalendar(weekStartStr, weekEndStr),
    enabled: open && activeTab === 'WEEK_GRID',
  });

  const scheduleMutation = useMutation({
    mutationFn: (request: ScheduleInterviewRequest) =>
      scheduleInterview(applicationId, request),
    onSuccess: () => {
      notify.success(
        `Đã lên lịch phỏng vấn và gửi email mời phỏng vấn tới ${candidateName}.`,
      );
      onScheduled();
    },
    onError: (error) => {
      notify.error(error);
    },
  });

  function toggleInterviewer(id: number) {
    setSelectedInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleCopyLink() {
    if (locationOrLink) {
      navigator.clipboard.writeText(locationOrLink);
      notify.success('Đã sao chép link cuộc họp vào clipboard.');
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormError(null);

    if (selectedInterviewerIds.length === 0) {
      setFormError('Vui lòng chọn ít nhất một người phỏng vấn.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setFormError('Vui lòng chọn ngày và giờ phỏng vấn.');
      return;
    }

    const payload: ScheduleInterviewRequest = {
      targetStageId,
      interviewerIds: selectedInterviewerIds,
      interviewDate: selectedDate,
      interviewTime: selectedTime,
      mode,
      locationOrLink: locationOrLink.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    scheduleMutation.mutate(payload);
  }

  // Mini Calendar calculations
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays = useMemo(() => {
    const days: Array<{ dayNum: number; dateStr: string; isPast: boolean; isCurrentMonth: boolean }> = [];
    // Leading padding for day of week
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNum: 0, dateStr: '', isPast: true, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr,
        isPast: dateStr < todayStr,
        isCurrentMonth: true,
      });
    }
    return days;
  }, [year, month, firstDayIndex, daysInMonth, todayStr]);

  // Week Grid days
  const weekDays = useMemo(() => {
    const days: Array<{ date: Date; dateStr: string; dayName: string; dayNum: number; isToday: boolean }> = [];
    const dayNames = ['T2 (Thứ 2)', 'T3 (Thứ 3)', 'T4 (Thứ 4)', 'T5 (Thứ 5)', 'T6 (Thứ 6)', 'T7 (Thứ 7)', 'CN (Chủ nhật)'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        dayName: dayNames[i],
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [weekStart, todayStr]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lên lịch phỏng vấn"
      description={`Xếp lịch cho ${candidateName} và chuyển sang "${targetStageName}".`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={scheduleMutation.isPending}
            title="Chỉ chuyển cột trên Kanban mà không tạo lịch phỏng vấn"
          >
            Bỏ qua (Chỉ chuyển Stage)
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-neutral-500">
              Đã chọn: <span className="font-semibold text-primary-700">{selectedDate} lúc {selectedTime}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={scheduleMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={scheduleMutation.isPending}
              onClick={() => handleSubmit()}
            >
              <CalendarCheck className="mr-1.5 size-4" />
              Gửi thư mời
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        {formError && (
          <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
            {formError}
          </div>
        )}

        {/* Top bar: Mode, Duration, Google Meet link preview */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-700">Hình thức:</span>
            <button
              type="button"
              onClick={() => {
                setMode('ONLINE');
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'ONLINE'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <VideoCamera className="size-3.5" />
              Online (Google Meet)
            </button>
            <button
              type="button"
              onClick={() => setMode('ONSITE')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'ONSITE'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <Buildings className="size-3.5" />
              Onsite (Trực tiếp)
            </button>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-700">Thời lượng:</span>
            {[30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  durationMinutes === mins
                    ? 'bg-primary-100 text-primary-800 border border-primary-300'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {mins} phút
              </button>
            ))}
          </div>

          {/* Google Meet Link Input & Quick Create */}
          {mode === 'ONLINE' ? (
            <div className="flex w-full flex-wrap items-center gap-2 pt-1 sm:w-auto">
              <input
                type="text"
                placeholder="Dán link Google Meet hoặc để trống nếu dùng Calendar API..."
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full sm:w-72 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs focus:border-primary-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => window.open('https://meet.google.com/new', '_blank')}
                title="Mở Google Meet để tạo ngay phòng họp thật trên Google"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-primary-600 transition-colors"
              >
                <span>Tạo phòng Meet ngay</span>
                <ArrowSquareOut className="size-3.5" />
              </button>
              {locationOrLink && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Sao chép link"
                  className="rounded p-1 text-neutral-500 hover:bg-white hover:text-primary-600"
                >
                  <Copy className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Nhập địa điểm / phòng họp onsite..."
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs focus:border-primary-500 focus:outline-none"
            />
          )}
        </div>

        {/* View Switcher Tabs (Ảnh 1 vs Ảnh 2) */}
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab('SLOTS')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'SLOTS'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <CalendarBlank className="size-4" />
            Chọn ngày & Khung giờ (Slots View)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WEEK_GRID')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'WEEK_GRID'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Table className="size-4" />
            Lưới lịch tuần trực quan (Odoo / Calendar View)
          </button>
        </div>

        {/* TAB 1: MINI CALENDAR + TIME SLOTS (Ảnh 1 style) */}
        {activeTab === 'SLOTS' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: Mini Month Calendar */}
            <div className="rounded-lg border border-neutral-200 p-3 lg:col-span-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800">
                  Tháng {calendarMonth.getMonth() + 1}, {calendarMonth.getFullYear()}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(new Date(year, month - 1, 1))
                    }
                    className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                  >
                    <CaretLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(new Date(year, month + 1, 1))
                    }
                    className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                  >
                    <CaretRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-400">
                <span>CN</span>
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
              </div>

              {/* Day cells */}
              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return <div key={idx} className="h-8" />;
                  }
                  const isSelected = item.dateStr === selectedDate;
                  const isToday = item.dateStr === todayStr;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={item.isPast}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        item.isPast
                          ? 'cursor-not-allowed text-neutral-300'
                          : isSelected
                          ? 'bg-primary-600 text-white font-bold shadow-sm'
                          : isToday
                          ? 'border border-primary-500 text-primary-700 hover:bg-primary-50'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {item.dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Time Slots */}
            <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 lg:col-span-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800">
                  Chọn giờ ({selectedDate})
                </span>
                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Clock className="size-3.5" />
                  Múi giờ: GMT+7
                </span>
              </div>

              {/* Morning Slots */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Buổi sáng
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {MORNING_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`rounded-md border py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Afternoon Slots */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Buổi chiều
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {AFTERNOON_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`rounded-md border py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEEK GRID CALENDAR VIEW (Ảnh 2 Odoo/Calendar style) */}
        {activeTab === 'WEEK_GRID' && (
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
            {/* Week navigation header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const day = now.getDay();
                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                    const mon = new Date(now.setDate(diff));
                    mon.setHours(0, 0, 0, 0);
                    setWeekStart(mon);
                  }}
                >
                  Hôm nay
                </Button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(weekStart);
                      prev.setDate(prev.getDate() - 7);
                      setWeekStart(prev);
                    }}
                    className="rounded border border-neutral-200 p-1 hover:bg-neutral-100"
                  >
                    <CaretLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(weekStart);
                      next.setDate(next.getDate() + 7);
                      setWeekStart(next);
                    }}
                    className="rounded border border-neutral-200 p-1 hover:bg-neutral-100"
                  >
                    <CaretRight className="size-4" />
                  </button>
                </div>
                <span className="text-xs font-bold text-neutral-800">
                  {weekDays[0].dayNum}/{weekDays[0].date.getMonth() + 1} – {weekDays[6].dayNum}/{weekDays[6].date.getMonth() + 1}/{weekDays[6].date.getFullYear()}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                💡 Click vào một ô giờ trống để chọn ngày & giờ phỏng vấn.
              </p>
            </div>

            {/* Grid Table */}
            <div className="max-h-72 overflow-y-auto rounded border border-neutral-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="sticky top-0 bg-neutral-100 text-neutral-600">
                    <th className="w-16 border-r border-b border-neutral-200 p-1.5 text-center text-[10px] font-semibold">
                      Giờ
                    </th>
                    {weekDays.map((col) => (
                      <th
                        key={col.dateStr}
                        className={`border-r border-b border-neutral-200 p-1.5 text-center text-[11px] font-semibold ${
                          col.isToday ? 'bg-primary-50 text-primary-700' : ''
                        }`}
                      >
                        {col.dayName}
                        <div className="text-[10px] text-neutral-400 font-normal">
                          {col.dateStr}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_HOURS.map((hour) => (
                    <tr key={hour} className="border-b border-neutral-200">
                      <td className="border-r border-neutral-200 p-1 text-center font-mono text-[10px] text-neutral-400">
                        {hour}
                      </td>
                      {weekDays.map((col) => {
                        const cellDateStr = col.dateStr;
                        // Find events at this date and hour
                        const eventsInCell = calendarEvents.filter(
                          (ev) =>
                            ev.interviewDate === cellDateStr &&
                            ev.interviewTime.startsWith(hour.slice(0, 2)),
                        );
                        const isSelectedSlot =
                          selectedDate === cellDateStr &&
                          selectedTime.startsWith(hour.slice(0, 2));

                        return (
                          <td
                            key={col.dateStr}
                            onClick={() => {
                              setSelectedDate(cellDateStr);
                              setSelectedTime(hour);
                            }}
                            className={`border-r border-neutral-200 p-1 cursor-pointer transition-colors relative h-10 ${
                              isSelectedSlot
                                ? 'bg-primary-100 ring-2 ring-primary-500 ring-inset'
                                : 'hover:bg-neutral-50'
                            }`}
                          >
                            {eventsInCell.map((ev) => (
                              <div
                                key={ev.interviewId}
                                title={`${ev.candidateName} - ${ev.jobTitle} (${ev.interviewTime})`}
                                className="mb-0.5 truncate rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-300"
                              >
                                🎯 {ev.candidateName} ({ev.interviewTime})
                              </div>
                            ))}
                            {isSelectedSlot && eventsInCell.length === 0 && (
                              <div className="flex items-center gap-1 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                <Check className="size-3" />
                                {selectedTime}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interviewers Assignment - Autocomplete Search & Tags */}
        <div className="relative flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-700">
            Hội đồng phỏng vấn (Interviewer) <span className="text-danger-500">*</span>
          </label>

          {/* Tag Chips & Input Container */}
          <div
            onClick={() => setIsInterviewerDropdownOpen(true)}
            className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-lg border border-neutral-300 bg-white p-1.5 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500"
          >
            {selectedInterviewers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-800 shadow-sm"
              >
                <span>{user.fullName}</span>
                {user.departmentName && (
                  <span className="text-[10px] text-primary-500">({user.departmentName})</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleInterviewer(user.id);
                  }}
                  className="rounded p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-700"
                >
                  <X className="size-3" weight="bold" />
                </button>
              </span>
            ))}

            <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
              <MagnifyingGlass className="size-3.5 shrink-0 text-neutral-400" />
              <input
                type="text"
                value={interviewerSearch}
                onFocus={() => setIsInterviewerDropdownOpen(true)}
                onChange={(e) => {
                  setInterviewerSearch(e.target.value);
                  setIsInterviewerDropdownOpen(true);
                }}
                placeholder={
                  selectedInterviewers.length === 0
                    ? 'Nhập tên hoặc email (ví dụ: I... để gợi ý Interviewer)'
                    : 'Thêm người phỏng vấn...'
                }
                className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isInterviewerDropdownOpen && (
            <>
              {/* Invisible backdrop to dismiss dropdown when clicking outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsInterviewerDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
                {isLoadingInterviewers ? (
                  <div className="p-2 text-center text-xs text-neutral-400">
                    Đang tải danh sách...
                  </div>
                ) : filteredInterviewers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-neutral-500">
                    {interviewers.length === 0
                      ? 'Chưa có tài khoản nào có vai trò Interviewer đang hoạt động.'
                      : 'Không tìm thấy người phỏng vấn phù hợp.'}
                  </div>
                ) : (
                  filteredInterviewers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedInterviewerIds((prev) => [...prev, user.id]);
                        setInterviewerSearch('');
                        setIsInterviewerDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-primary-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">
                          {user.fullName}
                        </p>
                        <p className="truncate text-[11px] text-neutral-500">
                          {user.email} {user.departmentName ? `• ${user.departmentName}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                        Chọn
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-neutral-700">
            Ghi chú nội bộ (tuỳ chọn)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nội dung lưu ý cho hội đồng phỏng vấn..."
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="rounded-md bg-neutral-100 p-2 text-[11px] text-neutral-600">
          💡 Thư mời phỏng vấn (mẫu <span className="font-semibold">EM-05</span>) sẽ tự động gửi tới ứng viên.
          Thông báo lịch họp (mẫu <span className="font-semibold">EM-08</span>) sẽ gửi tới tất cả Interviewer được chọn.
        </div>
      </div>
    </Modal>
  );
}
