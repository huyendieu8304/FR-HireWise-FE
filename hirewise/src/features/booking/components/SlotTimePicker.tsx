import { useState } from 'react';
import { Clock, Check, ChatTeardropText } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/utils/cn';
import type { BookingSlot } from '../types';

interface SlotTimePickerProps {
  selectedDate: string;
  slots: BookingSlot[];
  selectedSlotId: number | null;
  onSelectSlot: (slotId: number) => void;
  onConfirm: (slotId: number, notes?: string) => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export function SlotTimePicker({
  selectedDate,
  slots,
  selectedSlotId,
  onSelectSlot,
  onConfirm,
  isSubmitting,
  errorMessage,
}: SlotTimePickerProps) {
  const [notes, setNotes] = useState('');

  // Format date display
  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 pb-2 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-800 capitalize">
          {formattedDate}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          {slots.filter((s) => s.available !== undefined ? s.available : s.status === 'OPEN').length} / {slots.length} khung giờ khả dụng (múi giờ địa phương)
        </p>
      </div>

      {/* Slots List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
        {slots.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">
            Không có khung giờ nào cho ngày này. Vui lòng chọn ngày khác.
          </div>
        ) : (
          slots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            const isAvailable = slot.available !== undefined ? slot.available : slot.status === 'OPEN';

            const displayTime = slot.slotTime && slot.slotTime.length > 5 ? slot.slotTime.slice(0, 5) : slot.slotTime;

            return (
              <div key={slot.id} className="transition-all">
                <button
                  type="button"
                  disabled={!isAvailable || isSubmitting}
                  onClick={() => onSelectSlot(slot.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                    !isSelected &&
                      isAvailable &&
                      'border-primary-200 text-primary-700 bg-white hover:bg-primary-50/70 hover:border-primary-300 shadow-xs active:scale-[0.99] cursor-pointer',
                    isSelected &&
                      'border-primary-600 bg-primary-600 text-white font-bold shadow-md ring-2 ring-primary-600/30',
                    !isAvailable &&
                      'border-neutral-200 bg-neutral-100/90 text-neutral-400 cursor-not-allowed select-none shadow-none'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Clock className={cn('size-4', isSelected ? 'text-white' : isAvailable ? 'text-primary-500' : 'text-neutral-400')} />
                    <span className={cn(!isAvailable && 'line-through opacity-75')}>{displayTime}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs', isAvailable ? 'opacity-80' : 'opacity-60')}>
                      {slot.durationMinutes} phút
                    </span>
                  </div>
                </button>

                {/* Expanded Confirmation Box when Selected */}
                {isSelected && (
                  <div className="mt-2.5 rounded-xl border border-primary-100 bg-primary-50/50 p-3.5 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 mb-1">
                        <ChatTeardropText className="size-3.5" />
                        <span>Ghi chú cho buổi phỏng vấn (không bắt buộc)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Cần phỏng vấn online qua link..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full text-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    {errorMessage && (
                      <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                        {errorMessage}
                      </p>
                    )}

                    <Button
                      className="w-full justify-center shadow-md"
                      isLoading={isSubmitting}
                      onClick={() => onConfirm(slot.id, notes)}
                    >
                      <Check className="mr-1.5 size-4" weight="bold" />
                      Xác nhận giờ phỏng vấn {displayTime}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
