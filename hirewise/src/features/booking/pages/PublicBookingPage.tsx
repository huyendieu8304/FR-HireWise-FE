import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  VideoCamera,
  Buildings,
  User,
  Sparkle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { getBookingPage } from '../api/bookingPublicApi';
import { SlotCalendar } from '../components/SlotCalendar';
import { SlotTimePicker } from '../components/SlotTimePicker';
import { BookingExpired } from '../components/BookingExpired';

export function PublicBookingPage() {
  const { token } = useParams<{ token: string }>();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const {
    data: bookingData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['booking', 'public', token],
    queryFn: () => getBookingPage(token!),
    enabled: !!token,
    retry: 1,
  });

  // Calculate configured dates (dates that have slots) and open dates (dates with available slots)
  const configuredDates = useMemo(() => {
    const dates = new Set<string>();
    if (!bookingData?.slots) return dates;
    for (const slot of bookingData.slots) {
      dates.add(slot.slotDate);
    }
    return dates;
  }, [bookingData?.slots]);

  const openDates = useMemo(() => {
    const dates = new Set<string>();
    if (!bookingData?.slots) return dates;
    for (const slot of bookingData.slots) {
      const isAvailable = slot.available !== undefined ? slot.available : slot.status === 'OPEN';
      if (isAvailable) {
        dates.add(slot.slotDate);
      }
    }
    return dates;
  }, [bookingData?.slots]);

  // Auto-select first date that has available slots or configured slots
  useMemo(() => {
    if (!selectedDate) {
      if (openDates.size > 0) {
        const sortedDates = Array.from(openDates).sort();
        setSelectedDate(sortedDates[0]);
      } else if (configuredDates.size > 0) {
        const sortedDates = Array.from(configuredDates).sort();
        setSelectedDate(sortedDates[0]);
      }
    }
  }, [openDates, configuredDates, selectedDate]);

  // Filter slots for currently selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!bookingData?.slots || !selectedDate) return [];
    return bookingData.slots.filter((s) => s.slotDate === selectedDate);
  }, [bookingData?.slots, selectedDate]);

  // 1. Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50/60 py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-8 animate-pulse">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="h-6 w-24 bg-neutral-200 rounded" />
              <div className="h-8 w-48 bg-neutral-200 rounded" />
              <div className="h-4 w-36 bg-neutral-200 rounded" />
              <div className="h-20 bg-neutral-100 rounded-xl" />
            </div>
            <div className="flex-1 h-80 bg-neutral-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Expired / Inactive / Error View
  if (isError || !bookingData || bookingData.status !== 'OPEN') {
    const errorStatus = (error as any)?.response?.status;
    const message =
      bookingData?.status === 'COMPLETED'
        ? 'Buổi phỏng vấn đã được xác nhận thành công trước đó.'
        : bookingData?.status === 'EXPIRED'
          ? 'Liên kết chọn lịch đã hết hạn.'
          : errorStatus === 404
            ? 'Liên kết không tồn tại hoặc đã bị hủy.'
            : undefined;
    return (
      <div className="min-h-screen bg-neutral-50/50 py-12 px-4 flex items-center justify-center">
        <BookingExpired message={message} />
      </div>
    );
  }

  const isOnline = bookingData.mode === 'ONLINE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xl transition-all flex flex-col md:flex-row">
          {/* Left Column: Interview Details */}
          <div className="w-full md:w-80 bg-neutral-50/70 p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-200/60 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary-600 text-white font-bold shadow-sm">
                  HW
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-neutral-900">HireWise</div>
                  <div className="text-[11px] text-neutral-500 font-medium">Lịch phỏng vấn</div>
                </div>
              </div>

              {/* Position & Candidate Info */}
              <div className="pt-2 border-t border-neutral-200/60">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100/60 mb-2">
                  <Sparkle className="size-3.5" weight="fill" />
                  Mời phỏng vấn
                </div>
                <h1 className="text-xl font-bold text-neutral-900 leading-snug">
                  {bookingData.jobTitle}
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Chào <span className="font-semibold text-neutral-800">{bookingData.candidateName}</span>, hãy chọn một khung giờ phù hợp với bạn để tham gia phỏng vấn.
                </p>
              </div>

              {/* Meta Info */}
              <div className="space-y-3.5 pt-2 text-sm text-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                    <User className="size-4" weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Người phỏng vấn</div>
                    <div className="font-medium text-neutral-900">{bookingData.interviewerName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                    <Clock className="size-4" weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Thời lượng dự kiến</div>
                    <div className="font-medium text-neutral-900">45 phút</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                    {isOnline ? (
                      <VideoCamera className="size-4" weight="bold" />
                    ) : (
                      <Buildings className="size-4" weight="bold" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Hình thức phỏng vấn</div>
                    <div className="font-medium text-neutral-900">
                      {isOnline ? 'Phỏng vấn Trực tuyến (Online)' : 'Phỏng vấn Trực tiếp (Offline)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security note footer */}
            <div className="mt-8 pt-4 border-t border-neutral-200/50 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span>Liên kết bảo mật xác thực tự động</span>
            </div>
          </div>

          {/* Right Column: Calendar & Time Picker */}
          <div className="flex-1 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* Calendar Date Picker */}
              <div className="border-b md:border-b-0 md:border-r border-neutral-100 pb-6 md:pb-0 md:pr-4">
                <SlotCalendar
                  availableDates={configuredDates}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setSelectedSlotId(null);
                  }}
                  minDate={bookingData.dateRangeStart}
                  maxDate={bookingData.dateRangeEnd}
                />
              </div>

              {/* Time Slots Picker */}
              <div className="md:pl-2">
                {selectedDate ? (
                  <SlotTimePicker
                    selectedDate={selectedDate}
                    slots={slotsForSelectedDate}
                    selectedSlotId={selectedSlotId}
                    onSelectSlot={(id) => {
                      setSelectedSlotId(id);
                    }}
                    onConfirm={() => {}}
                    isSubmitting={false}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center text-sm text-neutral-400">
                    <div className="space-y-2">
                      <Calendar className="size-8 mx-auto text-neutral-300" />
                      <p>Vui lòng chọn một ngày trên lịch để xem các khung giờ còn trống.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
