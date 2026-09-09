import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  VideoCamera,
  Buildings,
  User,
  Sparkle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { getBookingPage, confirmBookingSlot } from '../api/bookingPublicApi';
import { SlotCalendar } from '../components/SlotCalendar';
import { SlotTimePicker } from '../components/SlotTimePicker';
import { BookingExpired } from '../components/BookingExpired';
import { BookingConfirmed } from '../components/BookingConfirmed';
import type { BookingConfirmResponse } from '../types';

export function PublicBookingPage() {
  const { token } = useParams<{ token: string }>();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: bookingData,
    isLoading,
    isError,
    error,
    refetch,
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

  // Set default selected date to first open date or first configured date
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

  // Confirm booking mutation
  const confirmMutation = useMutation({
    mutationFn: ({ slotId, notes }: { slotId: number; notes?: string }) =>
      confirmBookingSlot(token!, { slotId, notes }),
    onSuccess: (data) => {
      setConfirmation(data);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const errorDetail =
        err?.response?.data?.message ||
        'Khung giờ này vừa có người đặt hoặc không còn khả dụng. Vui lòng chọn khung giờ khác.';
      setErrorMessage(errorDetail);
      refetch();
    },
  });

  // 1. Confirmed View
  if (confirmation) {
    return (
      <div className="min-h-screen bg-neutral-50/50 py-12 px-4 flex items-center justify-center">
        <BookingConfirmed confirmation={confirmation} />
      </div>
    );
  }

  // 2. Loading Skeleton
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

  // 3. Expired or Invalid View
  if (isError || !bookingData || bookingData.status !== 'OPEN') {
    const isExpired =
      bookingData?.status === 'EXPIRED' ||
      bookingData?.status === 'COMPLETED' ||
      (error as any)?.response?.status === 409 ||
      (error as any)?.response?.status === 404;

    return (
      <div className="min-h-screen bg-neutral-50/50 py-12 px-4 flex items-center justify-center">
        <BookingExpired
          message={
            isExpired
              ? 'Liên kết phỏng vấn này đã hết hạn, đã hoàn thành hoặc không còn khả dụng.'
              : undefined
          }
        />
      </div>
    );
  }

  const isOnline = bookingData.mode === 'ONLINE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-primary-50/30 py-8 md:py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xl">
        <div className="flex flex-col md:flex-row">
          {/* Left Column: Interview Details */}
          <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-neutral-200/70 p-6 md:p-8 bg-neutral-50/40 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Brand & Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary-600 text-white font-black text-sm">
                    H
                  </div>
                  <span className="font-bold tracking-tight text-neutral-900 text-sm">
                    HireWise
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <Sparkle className="size-3" weight="fill" />
                  Self-service
                </span>
              </div>

              {/* Header Info */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Mời phỏng vấn
                </p>
                <h1 className="mt-1 text-xl font-extrabold text-neutral-900 leading-tight">
                  {bookingData.jobTitle}
                </h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Chào <strong className="text-neutral-900">{bookingData.candidateName}</strong>, vui lòng chọn một khung giờ phỏng vấn phù hợp bên dưới.
                </p>
              </div>

              {/* Meta Specs */}
              <div className="rounded-xl border border-neutral-200/70 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <Clock className="size-4.5 text-neutral-400" />
                  <span>Thời lượng: <strong>45 phút</strong></span>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  {isOnline ? (
                    <VideoCamera className="size-4.5 text-emerald-600" />
                  ) : (
                    <Buildings className="size-4.5 text-primary-600" />
                  )}
                  <span>
                    Hình thức:{' '}
                    <strong>{isOnline ? 'Online qua Google Meet' : 'Trực tiếp tại văn phòng'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <User className="size-4.5 text-neutral-400" />
                  <span>
                    Người phỏng vấn: <strong>{bookingData.interviewerName}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Security note footer */}
            <div className="mt-6 pt-4 border-t border-neutral-200/60 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" weight="fill" />
              <span>Lịch hẹn sẽ tự động lưu vào Calendar và gửi email xác nhận.</span>
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
                    setErrorMessage(null);
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
                      setErrorMessage(null);
                    }}
                    onConfirm={(slotId, notes) =>
                      confirmMutation.mutate({ slotId, notes })
                    }
                    isSubmitting={confirmMutation.isPending}
                    errorMessage={errorMessage}
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
