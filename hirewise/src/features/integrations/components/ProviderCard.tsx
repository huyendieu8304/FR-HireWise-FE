import { DropboxLogo, GoogleDriveLogo } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { PROVIDER_LABELS } from '../types';
import type { CloudStorageProvider } from '../types';

const PROVIDER_ICONS: Record<CloudStorageProvider, typeof GoogleDriveLogo> = {
  GOOGLE_DRIVE: GoogleDriveLogo,
  DROPBOX: DropboxLogo,
};

const PROVIDER_DESCRIPTIONS: Record<CloudStorageProvider, string> = {
  GOOGLE_DRIVE: 'Lưu CV/hợp đồng vào 1 thư mục "HireWise" riêng trên Google Drive.',
  DROPBOX: 'Lưu CV/hợp đồng vào thư mục "/HireWise" riêng trên Dropbox.',
};

export interface ProviderCardProps {
  provider: CloudStorageProvider;
  isLoading: boolean;
  onConnect: () => void;
}

/** 1 lựa chọn provider trong màn hình chưa kết nối / kết nối lại sau khi Revoked. */
export function ProviderCard({ provider, isLoading, onConnect }: ProviderCardProps) {
  const Icon = PROVIDER_ICONS[provider];

  return (
    <div className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-4 rounded-lg border border-neutral-200 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {PROVIDER_LABELS[provider]}
          </p>
          <p className="text-xs text-neutral-500">{PROVIDER_DESCRIPTIONS[provider]}</p>
        </div>
      </div>
      <Button variant="outline" isLoading={isLoading} onClick={onConnect}>
        Kết nối {PROVIDER_LABELS[provider]}
      </Button>
    </div>
  );
}
