import { useState } from 'react';
import {
  CheckCircle,
  CalendarCheck,
  Clock,
  VideoCamera,
  Buildings,
  User,
  Copy,
  Check,
  ArrowSquareOut,
  CalendarPlus,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import type { BookingConfirmResponse } from '../types';

interface BookingConfirmedProps {
  confirmation: BookingConfirmResponse;
}

export function BookingConfirmed({ confirmation }: BookingConfirmedProps) {
  const [copied, setCopied] = useState(false);

  const isOnline = confirmation.mode === 'ONLINE';

  const handleCopyLink = () => {
    if (confirmation.locationOrLink) {
      navigator.clipboard.writeText(confirmation.locationOrLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    try {
      const [year, month, day] = confirmation.interviewDate.split('-').map(Number);
      const [hours, minutes] = confirmation.interviewTime.split(':').map(Number);
      const startDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      const endDate = new Date(startDate.getTime() + (confirmation.durationMinutes || 45) * 60000);

      const formatIso = (d: Date) =>
        d.toISOString().replace(/-|:|\.\d+/g, '');

      const title = encodeURIComponent(`Phỏng vấn: ${confirmation.jobTitle} - ${confirmation.candidateName}`);
      const details = encodeURIComponent(
        `Buổi phỏng vấn vị trí ${confirmation.jobTitle} cùng người phỏng vấn ${confirmation.interviewerName}.\nChi tiết: ${confirmation.locationOrLink || ''}`
      );
      const location = encodeURIComponent(confirmation.locationOrLink || '');

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatIso(startDate)}/${formatIso(endDate)}&details=${details}&location=${location}`;
    } catch {
      return '#';
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl transition-all">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-8 ring-white/10">
            <CheckCircle className="size-10 text-white" weight="fill" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Xác nhận lịch phỏng vấn thành công!</h1>
          <p className="mt-1.5 text-sm text-emerald-100">
            Lịch phỏng vấn đã được ghi nhận vào hệ thống và email xác nhận đã được gửi đến bạn.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Summary Details */}
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/75 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CalendarCheck className="size-5" weight="bold" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">Thời gian phỏng vấn</p>
                <p className="text-base font-bold text-neutral-900">
                  {confirmation.interviewTime} — {confirmation.interviewDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/60">
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Clock className="size-4 text-neutral-400" />
                <span>Thời lượng: <strong>{confirmation.durationMinutes} phút</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                {isOnline ? (
                  <VideoCamera className="size-4 text-emerald-600" />
                ) : (
                  <Buildings className="size-4 text-primary-600" />
                )}
                <span>Hình thức: <strong>{isOnline ? 'Trực tuyến (Online)' : 'Trực tiếp (Onsite)'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
                <User className="size-4 text-neutral-400" />
                <span>Người phỏng vấn: <strong>{confirmation.interviewerName}</strong></span>
              </div>
            </div>
          </div>

          {/* Meeting Link or Location */}
          {confirmation.locationOrLink && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-semibold text-blue-900 mb-1.5 flex items-center gap-1.5">
                {isOnline ? <VideoCamera className="size-4 text-blue-700" /> : <Buildings className="size-4 text-blue-700" />}
                {isOnline ? 'Đường dẫn phòng họp (Google Meet)' : 'Địa điểm tham gia phỏng vấn'}
              </p>

              {isOnline ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <span className="flex-1 truncate font-mono text-sm text-blue-800 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200">
                    {confirmation.locationOrLink}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-neutral-50"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <>
                          <Check className="size-4 text-emerald-600 mr-1" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 mr-1" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </Button>
                    <a
                      href={confirmation.locationOrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      <span>Vào phòng</span>
                      <ArrowSquareOut className="size-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-900 font-medium">{confirmation.locationOrLink}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-neutral-800 transition-colors"
            >
              <CalendarPlus className="size-4" weight="bold" />
              <span>Thêm vào Google Calendar</span>
            </a>
          </div>

          <p className="text-center text-xs text-neutral-400">
            Nếu cần thay đổi khung giờ hoặc có câu hỏi đột xuất, vui lòng liên hệ bộ phận Tuyển dụng qua email.
          </p>
        </div>
      </div>
    </div>
  );
}
