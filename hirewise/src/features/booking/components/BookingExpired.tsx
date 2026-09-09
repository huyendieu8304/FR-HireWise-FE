import { ClockCountdown, EnvelopeSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';

interface BookingExpiredProps {
  message?: string;
}

export function BookingExpired({ message }: BookingExpiredProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
          <ClockCountdown className="size-8" weight="duotone" />
        </div>

        <h2 className="text-xl font-bold text-neutral-900">
          Liên kết đã hết hạn hoặc không khả dụng
        </h2>

        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          {message ||
            'Liên kết tự chọn lịch phỏng vấn này đã hết hạn hiệu lực hoặc các khung giờ phỏng vấn đã được hoàn tất.'}
        </p>

        <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-xs text-neutral-500 border border-neutral-100 text-left">
          <div className="flex items-center gap-2 font-semibold text-neutral-700">
            <EnvelopeSimple className="size-4" />
            <span>Bạn cần hỗ trợ xếp lịch mới?</span>
          </div>
          <p className="mt-1">
            Vui lòng phản hồi trực tiếp qua email thư mời bạn đã nhận được từ nhà tuyển dụng để được cấp liên kết hoặc xếp lịch mới.
          </p>
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </div>
      </div>
    </div>
  );
}
