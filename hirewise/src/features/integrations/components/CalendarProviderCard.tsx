import { GoogleLogo, MicrosoftOutlookLogo } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import {
  CALENDAR_PROVIDER_DESCRIPTIONS,
  CALENDAR_PROVIDER_LABELS,
} from '../types';
import type { CalendarProvider } from '../types';

const PROVIDER_ICONS: Record<CalendarProvider, typeof GoogleLogo> = {
  GOOGLE_CALENDAR: GoogleLogo,
  OUTLOOK_CALENDAR: MicrosoftOutlookLogo,
};

export interface CalendarProviderCardProps {
  provider: CalendarProvider;
  isLoading: boolean;
  onConnect: () => void;
}

/** 1 lựa chọn Calendar provider trong màn hình chưa kết nối / kết nối lại. */
export function CalendarProviderCard({
  provider,
  isLoading,
  onConnect,
}: CalendarProviderCardProps) {
  const Icon = PROVIDER_ICONS[provider];

  return (
    <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-4 rounded-lg border border-neutral-200 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {CALENDAR_PROVIDER_LABELS[provider]}
          </p>
          <p className="text-xs text-neutral-500">
            {CALENDAR_PROVIDER_DESCRIPTIONS[provider]}
          </p>
        </div>
      </div>
      <Button variant="outline" isLoading={isLoading} onClick={onConnect}>
        Kết nối {CALENDAR_PROVIDER_LABELS[provider]}
      </Button>
    </div>
  );
}
