import { useState, useCallback, useEffect } from 'react';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  CalendarCheck,
  VideoCamera,
  MapPin,
  User,
  Users,
  FileText,
  ArrowSquareOut,
  X,
  Copy,
  Check,
  ShieldCheck,
} from '@phosphor-icons/react';
import type { InterviewCalendarItem } from '@/features/kanban/types';
import { getInterviewCalendar } from '@/features/kanban/api/interviewApi';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useNotification } from '@/hooks/useNotification';

/* ─────────── helpers ─────────── */
const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAYS_FULL_VN = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const MONTHS_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfWeek(d: Date) {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}
function endOfWeek(d: Date) {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - day));
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function formatTime(t: string) {
  return t?.slice(0, 5) ?? '';
}
function formatDateVn(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Parse "HH:mm:ss" -> add 45 min -> "HH:mm" */
function addMinutesToTime(t: string, minutes: number): string {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** Tạo link Google Calendar Web để Interviewer/Recruiter lưu ngay vào lịch cá nhân */
function getGoogleCalendarUrl(event: InterviewCalendarItem): string {
  const title = encodeURIComponent(`Phỏng vấn ${event.candidateName} – ${event.jobTitle}`);
  const [year, month, day] = event.interviewDate.split('-').map(Number);
  const [hour, minute] = event.interviewTime.split(':').map(Number);
  const startStr = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const totalEndMin = hour * 60 + minute + 45;
  const endH = Math.floor(totalEndMin / 60) % 24;
  const endM = totalEndMin % 60;
  const endStr = `${year}${pad(month)}${pad(day)}T${pad(endH)}${pad(endM)}00`;
  const details = encodeURIComponent(
    `Ứng viên: ${event.candidateName} (${event.candidateEmail || 'N/A'})\n` +
    `Vị trí tuyển dụng: ${event.jobTitle}\n` +
    `Người phỏng vấn: ${event.interviewerNames.join(', ')}\n` +
    (event.locationOrLink ? `Link/Địa điểm: ${event.locationOrLink}\n` : '') +
    (event.notes ? `Ghi chú: ${event.notes}` : '')
  );
  const location = encodeURIComponent(event.locationOrLink || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

type ViewMode = 'month' | 'week';

/* ── Status config (light-mode pastel tones) ── */
const STATUS_COLORS: Record<string, { chip: string; dot: string; event: string; border: string }> = {
  SCHEDULED: {
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    event: 'bg-blue-50/80 hover:bg-blue-100/70 text-blue-800 border-blue-200',
    border: 'border-blue-200',
  },
  COMPLETED: {
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    event: 'bg-emerald-50/80 hover:bg-emerald-100/70 text-emerald-800 border-emerald-200',
    border: 'border-emerald-200',
  },
  CANCELLED: {
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    event: 'bg-rose-50/80 hover:bg-rose-100/70 text-rose-800 border-rose-200',
    border: 'border-rose-200',
  },
  NO_SHOW: {
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    event: 'bg-amber-50/80 hover:bg-amber-100/70 text-amber-800 border-amber-200',
    border: 'border-amber-200',
  },
};
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Đã xếp lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Vắng mặt',
};

/* ─────────── Google Meet 4-color Camera Icon & Badge ─────────── */
function GoogleMeetIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 13.5L19.5 17V7L15 10.5V6C15 4.9 14.1 4 13 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H13C14.1 20 15 19.1 15 18V13.5Z" fill="#00832D" />
      <path d="M15 8.5L19.5 5V19L15 15.5V8.5Z" fill="#00AC47" />
      <path d="M15 6V10.5L9.5 6H15Z" fill="#EA4335" />
      <path d="M4 6H9.5L4 10.5V6Z" fill="#2684FC" />
      <path d="M4 18V13.5L9.5 18H4Z" fill="#0066DA" />
      <path d="M15 18H9.5L15 13.5V18Z" fill="#FBBC04" />
    </svg>
  );
}

function GoogleMeetBadge() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs">
      <GoogleMeetIcon className="w-6 h-6" />
    </div>
  );
}

/* ─────────── Google Calendar Icon ─────────── */
function GoogleCalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#ffffff" />
      <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#1A73E8" />
      <path d="M5 6H19V9H5V6Z" fill="#4285F4" />
      <circle cx="8.5" cy="13" r="1.3" fill="#EA4335" />
      <circle cx="15.5" cy="13" r="1.3" fill="#34A853" />
      <circle cx="8.5" cy="17" r="1.3" fill="#FBBC04" />
      <circle cx="15.5" cy="17" r="1.3" fill="#4285F4" />
    </svg>
  );
}

/* ─────────── InfoRow ─────────── */
function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div className="text-sm text-slate-700 leading-relaxed flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ─────────── Event Detail Modal (Google Calendar style — Light) ─────────── */
function EventDetailModal({
  event,
  onClose,
}: {
  event: InterviewCalendarItem;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const notify = useNotification();
  const [copied, setCopied] = useState(false);
  const colors = STATUS_COLORS[event.status] ?? STATUS_COLORS.SCHEDULED;
  const date = new Date(event.interviewDate + 'T00:00:00');
  const startTime = formatTime(event.interviewTime);
  const endTime = addMinutesToTime(event.interviewTime, 45);
  const dayOfWeek = DAYS_FULL_VN[date.getDay()];

  const isMeetLink = event.locationOrLink &&
    (event.locationOrLink.includes('meet.google.com') || event.locationOrLink.includes('meet.jit.si'));

  function handleCopyLink() {
    if (event.locationOrLink) {
      navigator.clipboard.writeText(event.locationOrLink);
      setCopied(true);
      notify.success('Đã sao chép link cuộc họp Google Meet.');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  /* Rút gọn "https://meet.google.com/abc-efgh-ijk" → "meet.google.com/abc-efgh-ijk" */
  const shortLink = event.locationOrLink
    ? event.locationOrLink.replace(/^https?:\/\//, '')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Card — Google Calendar popup style */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header strip + close button */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3.5 bg-slate-50/60 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colors.chip}`}>
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Vị trí: <strong className="text-slate-800 font-semibold">{event.jobTitle}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              Phỏng vấn {event.candidateName} – {event.jobTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
            title="Đóng"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Thời gian */}
          <div className="flex items-start gap-3">
            <CalendarBlank size={18} className="mt-0.5 text-blue-600 shrink-0" weight="duotone" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {dayOfWeek}, {formatDateVn(date)}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                <span>{startTime} – {endTime}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  45 phút
                </span>
              </div>
            </div>
          </div>

          {/* Khối Google Meet nếu là online / có link */}
          {event.locationOrLink && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 flex items-start gap-3.5">
              <GoogleMeetBadge />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Nút pill xanh Google Meet */}
                  <a
                    href={event.locationOrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold px-4 py-2 transition shadow-sm active:scale-95"
                  >
                    <VideoCamera size={14} weight="fill" />
                    {isMeetLink ? 'Tham gia bằng Google Meet' : 'Tham gia cuộc họp'}
                  </a>

                  {/* Nút copy link bên cạnh nút tham gia */}
                  <button
                    onClick={handleCopyLink}
                    title="Sao chép link Google Meet"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-600" weight="bold" />
                        <span className="text-emerald-600 font-medium">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-slate-500" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Đường link hiển thị dạng meet.google.com/xxx-yyyy-zzz */}
                {shortLink && (
                  <div className="mt-2 text-xs text-slate-500">
                    Link: <a
                      href={event.locationOrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#1a73e8] hover:underline break-all"
                    >
                      {shortLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Địa điểm onsite (khi không phải meet link) */}
          {event.mode === 'ONSITE' && event.locationOrLink && !isMeetLink && (
            <InfoRow icon={<MapPin size={18} className="text-orange-500" weight="duotone" />}>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Địa điểm phỏng vấn:</span>
                <span className="text-sm text-slate-800 font-medium">{event.locationOrLink}</span>
              </div>
            </InfoRow>
          )}

          {/* Ứng viên & Email */}
          <InfoRow icon={<User size={18} className="text-slate-400" weight="duotone" />}>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Ứng viên:</span>
              <span className="text-sm font-semibold text-slate-800">{event.candidateName}</span>
              {event.candidateEmail && (
                <span className="text-xs text-slate-500 ml-1.5">({event.candidateEmail})</span>
              )}
            </div>
          </InfoRow>

          {/* Người phỏng vấn */}
          {event.interviewerNames.length > 0 && (
            <InfoRow icon={<Users size={18} className="text-slate-400" weight="duotone" />}>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Người phỏng vấn:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {event.interviewerNames.map((name, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </InfoRow>
          )}

          {/* Ghi chú / mô tả */}
          {event.notes && (
            <InfoRow icon={<FileText size={18} className="text-slate-400" weight="duotone" />}>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Ghi chú:</span>
                <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100 mt-1 leading-relaxed whitespace-pre-wrap">
                  {event.notes}
                </p>
              </div>
            </InfoRow>
          )}

          {/* Đồng bộ Google Calendar */}
          <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-white p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-blue-600" weight="duotone" />
              <span className="text-xs font-semibold text-slate-800">
                Đồng bộ Google Calendar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Lưu sự kiện vào Google Calendar cá nhân để nhận thông báo trước giờ phỏng vấn và chủ động sắp xếp thời gian.
            </p>
            <div className="pt-0.5">
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition shadow-2xs active:scale-98"
              >
                <GoogleCalendarIcon className="w-4 h-4" />
                <span>Thêm vào Google Calendar</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
          <button
            onClick={() => {
              navigate(ROUTES.APPLICATION_DETAIL.replace(':applicationId', event.applicationId));
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
          >
            <ArrowSquareOut size={14} />
            Xem hồ sơ ứng viên
          </button>
          {event.locationOrLink && (
            <a
              href={event.locationOrLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white px-3.5 py-1.5 text-xs font-medium transition shadow-sm"
            >
              <VideoCamera size={14} weight="fill" />
              Vào phòng họp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Event Chip (inside calendar cell) ─────────── */
function EventChip({
  item,
  onClick,
}: {
  item: InterviewCalendarItem;
  onClick: () => void;
}) {
  const colors = STATUS_COLORS[item.status] ?? STATUS_COLORS.SCHEDULED;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`group flex w-full cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs transition shadow-2xs hover:shadow-xs hover:brightness-95 ${colors.event}`}
    >
      <span className="truncate font-bold tracking-tight text-slate-900 shrink-0">
        {formatTime(item.interviewTime)}
      </span>
      <span className="truncate font-medium flex-1 text-slate-700">
        {item.candidateName}
      </span>
      {item.mode === 'ONLINE' ? (
        <VideoCamera size={12} className="shrink-0 text-blue-600 opacity-70" weight="fill" />
      ) : (
        <MapPin size={12} className="shrink-0 text-amber-600 opacity-70" weight="fill" />
      )}
    </button>
  );
}

/* ─────────── Month View ─────────── */
function MonthView({
  cursor,
  items,
  today,
  onSelectEvent,
}: {
  cursor: Date;
  items: InterviewCalendarItem[];
  today: Date;
  onSelectEvent: (item: InterviewCalendarItem) => void;
}) {
  const firstDay = startOfMonth(cursor);
  const lastDay = endOfMonth(cursor);
  const gridStart = startOfWeek(firstDay);
  const gridEnd = endOfWeek(lastDay);

  const cells: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    cells.push(new Date(d));
    d = addDays(d, 1);
  }

  const itemsByDate: Record<string, InterviewCalendarItem[]> = {};
  for (const item of items) {
    const k = item.interviewDate;
    if (!itemsByDate[k]) itemsByDate[k] = [];
    itemsByDate[k].push(item);
  }

  const inMonth = (day: Date) =>
    day.getMonth() === cursor.getMonth() && day.getFullYear() === cursor.getFullYear();

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
        {DAYS_VN.map((dv) => (
          <div key={dv} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
            {dv}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 border-b border-slate-200">
        {cells.map((day, i) => {
          const key = toDateStr(day);
          const dayItems = itemsByDate[key] ?? [];
          const isToday = sameDay(day, today);
          const isCurrentMonth = inMonth(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={i}
              className={`relative min-h-[110px] border-b border-slate-200 p-2 transition
                ${!isCurrentMonth ? 'opacity-40 bg-slate-50/60' : ''}
                ${isWeekend && isCurrentMonth ? 'bg-slate-50/30' : 'bg-white'}
              `}
            >
              {/* Day number */}
              <span
                className={`mb-1.5 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium
                  ${isToday
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                  }`}
              >
                {day.getDate()}
              </span>

              {/* Events */}
              <div className="space-y-1.5">
                {dayItems.slice(0, 3).map((item) => (
                  <EventChip key={item.interviewId} item={item} onClick={() => onSelectEvent(item)} />
                ))}
                {dayItems.length > 3 && (
                  <p className="pl-1 text-xs text-slate-500 font-medium">+{dayItems.length - 3} thêm</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Week View ─────────── */
function WeekView({
  cursor,
  items,
  today,
  onSelectEvent,
}: {
  cursor: Date;
  items: InterviewCalendarItem[];
  today: Date;
  onSelectEvent: (item: InterviewCalendarItem) => void;
}) {
  const weekStart = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const itemsByDate: Record<string, InterviewCalendarItem[]> = {};
  for (const item of items) {
    const k = item.interviewDate;
    if (!itemsByDate[k]) itemsByDate[k] = [];
    itemsByDate[k].push(item);
  }
  for (const k of Object.keys(itemsByDate)) {
    itemsByDate[k].sort((a, b) => a.interviewTime.localeCompare(b.interviewTime));
  }

  return (
    <div className="overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
        {days.map((day) => {
          const isToday = sameDay(day, today);
          return (
            <div key={toDateStr(day)} className="py-3 text-center border-r border-slate-200 last:border-r-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {DAYS_VN[day.getDay()]}
              </p>
              <span
                className={`mt-1 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold
                  ${isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800'}`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Events columns */}
      <div className="grid min-h-[440px] grid-cols-7 divide-x divide-slate-200 bg-white">
        {days.map((day) => {
          const key = toDateStr(day);
          const dayItems = itemsByDate[key] ?? [];
          return (
            <div key={key} className="space-y-2 p-2 sm:p-2.5">
              {dayItems.length === 0 && (
                <div className="flex h-full min-h-[80px] items-center justify-center">
                  <span className="text-xs text-slate-300">—</span>
                </div>
              )}
              {dayItems.map((item) => {
                const colors = STATUS_COLORS[item.status] ?? STATUS_COLORS.SCHEDULED;
                return (
                  <button
                    key={item.interviewId}
                    onClick={() => onSelectEvent(item)}
                    className={`w-full cursor-pointer rounded-lg border p-2.5 text-left transition shadow-2xs hover:shadow-xs hover:brightness-95 ${colors.event}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">{formatTime(item.interviewTime)}</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-white/80 border border-slate-200/60 text-slate-600">
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-800">{item.candidateName}</p>
                    <p className="truncate text-[11px] text-slate-600">{item.jobTitle}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-slate-500">
                      {item.mode === 'ONLINE'
                        ? <VideoCamera size={12} className="text-blue-600" weight="fill" />
                        : <MapPin size={12} className="text-amber-600" weight="fill" />}
                      <span className="text-[10px] font-medium">{item.mode === 'ONLINE' ? 'Google Meet' : 'Trực tiếp (Onsite)'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export function InterviewCalendarPage() {
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [items, setItems] = useState<InterviewCalendarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<InterviewCalendarItem | null>(null);

  const fetchRange = useCallback(() => {
    if (viewMode === 'month') {
      const s = startOfWeek(startOfMonth(cursor));
      const e = endOfWeek(endOfMonth(cursor));
      return { start: toDateStr(s), end: toDateStr(e) };
    } else {
      const s = startOfWeek(cursor);
      const e = endOfWeek(cursor);
      return { start: toDateStr(s), end: toDateStr(e) };
    }
  }, [viewMode, cursor]);

  useEffect(() => {
    const { start, end } = fetchRange();
    setLoading(true);
    getInterviewCalendar(start, end)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [fetchRange]);

  function navigate(dir: -1 | 1) {
    if (viewMode === 'month') {
      setCursor(addMonths(cursor, dir));
    } else {
      setCursor(addDays(cursor, dir * 7));
    }
  }

  const title =
    viewMode === 'month'
      ? `${MONTHS_VN[cursor.getMonth()]} ${cursor.getFullYear()}`
      : (() => {
          const ws = startOfWeek(cursor);
          const we = endOfWeek(cursor);
          return `${formatDateVn(ws)} – ${formatDateVn(we)}`;
        })();

  const todayStr = toDateStr(today);
  const todayCount = items.filter((i) => i.interviewDate === todayStr).length;

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Page shell — Light ── */}
      <div className="flex flex-1 flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3.5">

          {/* Left: icon + title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <CalendarBlank size={18} className="text-blue-600" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-900">Lịch phỏng vấn</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200" title="Chỉ hiển thị lịch phỏng vấn bạn tham gia hoặc phụ trách">
                  <ShieldCheck size={12} className="text-blue-600" weight="bold" />
                  Chỉ lịch liên quan
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Hôm nay: <span className="font-semibold text-blue-600">{todayCount}</span> lịch
              </p>
            </div>
          </div>

          {/* Center: navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <CaretLeft size={14} />
            </button>
            <button
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Hôm nay
            </button>
            <button
              onClick={() => navigate(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <CaretRight size={14} />
            </button>
            <span className="ml-1 min-w-[180px] text-center text-sm font-semibold text-slate-900">
              {title}
            </span>
          </div>

          {/* Right: legend + view toggle */}
          <div className="flex items-center gap-3">
            {/* Status legend */}
            <div className="hidden items-center gap-3 md:flex">
              {Object.entries(STATUS_LABELS).map(([k, label]) => {
                const c = STATUS_COLORS[k];
                return (
                  <span key={k} className="flex items-center gap-1 text-xs text-slate-500">
                    <span className={`size-2 rounded-full ${c.dot}`} />
                    {label}
                  </span>
                );
              })}
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['month', 'week'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition
                    ${viewMode === v
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {v === 'month' ? 'Tháng' : 'Tuần'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calendar body ── */}
        <div className="relative flex-1 bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="size-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-xs text-slate-500">Đang tải lịch...</span>
              </div>
            </div>
          )}

          {viewMode === 'month' ? (
            <MonthView cursor={cursor} items={items} today={today} onSelectEvent={setSelected} />
          ) : (
            <WeekView cursor={cursor} items={items} today={today} onSelectEvent={setSelected} />
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <EventDetailModal event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
