import { useState, useCallback, useEffect } from 'react';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  VideoCamera,
  MapPin,
  User,
  Clock,
  ArrowSquareOut,
  X,
} from '@phosphor-icons/react';
import type { InterviewCalendarItem } from '@/features/kanban/types';
import { getInterviewCalendar } from '@/features/kanban/api/interviewApi';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

/* ─────────── helpers ─────────── */
const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
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
  const day = d.getDay(); // 0=Sun
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
  // "09:30:00" -> "09:30"
  return t?.slice(0, 5) ?? '';
}
function formatDateVn(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

type ViewMode = 'month' | 'week';

const STATUS_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  SCHEDULED: { bg: 'bg-blue-500/15 border-blue-400/40', dot: 'bg-blue-400', text: 'text-blue-300' },
  COMPLETED: { bg: 'bg-emerald-500/15 border-emerald-400/40', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  CANCELLED: { bg: 'bg-red-500/15 border-red-400/40', dot: 'bg-red-400', text: 'text-red-300' },
  NO_SHOW:   { bg: 'bg-amber-500/15 border-amber-400/40', dot: 'bg-amber-400', text: 'text-amber-300' },
};
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Đã xếp lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Vắng mặt',
};

/* ─────────── Event Detail Modal ─────────── */
function EventDetailModal({
  event,
  onClose,
}: {
  event: InterviewCalendarItem;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const colors = STATUS_COLORS[event.status] ?? STATUS_COLORS.SCHEDULED;
  const date = new Date(event.interviewDate + 'T00:00:00');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #1e2235 0%, #161929 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Chi tiết lịch phỏng vấn
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{event.candidateName}</h2>
            <p className="text-sm text-slate-400">{event.jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-5">
          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            <span className={`size-1.5 rounded-full ${colors.dot}`} />
            {STATUS_LABELS[event.status] ?? event.status}
          </span>

          <div className="grid gap-2.5">
            <InfoRow icon={<CalendarBlank size={15} className="text-slate-400" />}>
              {formatDateVn(date)} &nbsp;•&nbsp;{' '}
              <strong className="text-white">{formatTime(event.interviewTime)}</strong>
            </InfoRow>

            <InfoRow
              icon={
                event.mode === 'ONLINE'
                  ? <VideoCamera size={15} className="text-blue-400" />
                  : <MapPin size={15} className="text-orange-400" />
              }
            >
              {event.mode === 'ONLINE' ? 'Online' : 'Onsite'}
            </InfoRow>

            {event.locationOrLink && (
              <InfoRow icon={<ArrowSquareOut size={15} className="text-indigo-400" />}>
                <a
                  href={event.locationOrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                >
                  {event.locationOrLink}
                </a>
              </InfoRow>
            )}

            {event.interviewerNames.length > 0 && (
              <InfoRow icon={<User size={15} className="text-slate-400" />}>
                <span className="text-slate-300">
                  {event.interviewerNames.join(', ')}
                </span>
              </InfoRow>
            )}

            <InfoRow icon={<Clock size={15} className="text-slate-400" />}>
              <span className="text-slate-400 text-xs">
                Email: {event.candidateEmail}
              </span>
            </InfoRow>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-white/10 p-4">
          {event.locationOrLink && (
            <a
              href={event.locationOrLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <VideoCamera size={16} />
              Vào phòng họp
            </a>
          )}
          <button
            onClick={() => {
              navigate(ROUTES.APPLICATION_DETAIL.replace(':applicationId', event.applicationId));
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            Xem hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-slate-300">{children}</span>
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
      className={`group flex w-full cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 text-left text-xs transition hover:brightness-125 ${colors.bg} ${colors.text}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${colors.dot}`} />
      <span className="truncate font-medium">{formatTime(item.interviewTime)}</span>
      <span className="truncate opacity-80">{item.candidateName}</span>
      {item.mode === 'ONLINE' ? (
        <VideoCamera size={10} className="ml-auto shrink-0 opacity-60" />
      ) : (
        <MapPin size={10} className="ml-auto shrink-0 opacity-60" />
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
  // Grid starts from the Sunday of the first week
  const gridStart = startOfWeek(firstDay);
  // Grid ends at the Saturday of the last week
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
    <div className="flex flex-col gap-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {DAYS_VN.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-white/5">
        {cells.map((day, i) => {
          const key = toDateStr(day);
          const dayItems = itemsByDate[key] ?? [];
          const isToday = sameDay(day, today);
          const isCurrentMonth = inMonth(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={i}
              className={`relative min-h-[100px] border-b border-white/5 p-1.5 transition
                ${!isCurrentMonth ? 'opacity-35' : ''}
                ${isWeekend && isCurrentMonth ? 'bg-white/[0.02]' : ''}
              `}
            >
              {/* Day number */}
              <span
                className={`mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium
                  ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
              >
                {day.getDate()}
              </span>

              {/* Events */}
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <EventChip key={item.interviewId} item={item} onClick={() => onSelectEvent(item)} />
                ))}
                {dayItems.length > 3 && (
                  <p className="pl-1 text-xs text-slate-500">+{dayItems.length - 3} thêm</p>
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
  // Sort by time
  for (const k of Object.keys(itemsByDate)) {
    itemsByDate[k].sort((a, b) => a.interviewTime.localeCompare(b.interviewTime));
  }

  return (
    <div className="overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {days.map((day) => {
          const isToday = sameDay(day, today);
          return (
            <div key={toDateStr(day)} className="py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {DAYS_VN[day.getDay()]}
              </p>
              <span
                className={`mt-1 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold
                  ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-200'}`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Events columns */}
      <div className="grid min-h-[400px] grid-cols-7 divide-x divide-white/5">
        {days.map((day) => {
          const key = toDateStr(day);
          const dayItems = itemsByDate[key] ?? [];
          return (
            <div key={key} className="space-y-1.5 p-2">
              {dayItems.length === 0 && (
                <div className="flex h-full min-h-[60px] items-center justify-center">
                  <span className="text-xs text-slate-700">—</span>
                </div>
              )}
              {dayItems.map((item) => {
                const colors = STATUS_COLORS[item.status] ?? STATUS_COLORS.SCHEDULED;
                return (
                  <button
                    key={item.interviewId}
                    onClick={() => onSelectEvent(item)}
                    className={`w-full cursor-pointer rounded-lg border p-2 text-left transition hover:brightness-125 ${colors.bg} ${colors.text}`}
                  >
                    <p className="flex items-center gap-1 text-xs font-bold">
                      <Clock size={10} />
                      {formatTime(item.interviewTime)}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium">{item.candidateName}</p>
                    <p className="truncate text-[11px] opacity-70">{item.jobTitle}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {item.mode === 'ONLINE'
                        ? <VideoCamera size={10} />
                        : <MapPin size={10} />}
                      <span className="text-[10px] opacity-70">
                        {item.mode === 'ONLINE' ? 'Online' : 'Onsite'}
                      </span>
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

  // Compute date range to fetch
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

  // Navigation
  function navigate(dir: -1 | 1) {
    if (viewMode === 'month') {
      setCursor(addMonths(cursor, dir));
    } else {
      setCursor(addDays(cursor, dir * 7));
    }
  }

  // Title
  const title =
    viewMode === 'month'
      ? `${MONTHS_VN[cursor.getMonth()]} ${cursor.getFullYear()}`
      : (() => {
          const ws = startOfWeek(cursor);
          const we = endOfWeek(cursor);
          return `${formatDateVn(ws)} – ${formatDateVn(we)}`;
        })();

  const totalScheduled = items.filter((i) => i.status === 'SCHEDULED').length;

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Page shell ── */}
      <div
        className="flex flex-1 flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0f1221 0%, #111827 50%, #0d1117 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* ── Toolbar ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Left: title + nav */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
              <CalendarBlank size={18} className="text-indigo-400" weight="duotone" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Lịch phỏng vấn</h1>
              <p className="text-xs text-slate-400">
                {totalScheduled} buổi đang xếp lịch
              </p>
            </div>
          </div>

          {/* Center: nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <CaretLeft size={14} />
            </button>
            <button
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Hôm nay
            </button>
            <button
              onClick={() => navigate(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <CaretRight size={14} />
            </button>
            <span className="ml-1 min-w-[180px] text-center text-sm font-semibold text-white">
              {title}
            </span>
          </div>

          {/* Right: view toggle + legend */}
          <div className="flex items-center gap-3">
            {/* Status legend */}
            <div className="hidden items-center gap-3 md:flex">
              {Object.entries(STATUS_LABELS).map(([k, label]) => {
                const c = STATUS_COLORS[k];
                return (
                  <span key={k} className="flex items-center gap-1 text-xs text-slate-400">
                    <span className={`size-2 rounded-full ${c.dot}`} />
                    {label}
                  </span>
                );
              })}
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-white/15 p-0.5">
              {(['month', 'week'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition
                    ${viewMode === v
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {v === 'month' ? 'Tháng' : 'Tuần'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calendar body ── */}
        <div className="relative flex-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="text-xs text-slate-400">Đang tải lịch...</span>
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
