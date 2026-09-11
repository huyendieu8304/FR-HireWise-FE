import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { Switch } from '@/components/ui/Switch/Switch';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { useNotification } from '@/hooks/useNotification';
import { AppError } from '@/types/api';
import {
  listPublishingChannels,
  updatePublishingChannel,
} from '../api/publishingChannelsApi';
import { PUBLISHING_CHANNEL_DESCRIPTIONS } from '../types';
import type { PublishingChannel } from '../types';

const CHANNELS_QUERY_KEY = ['publishing-channels'];

/**
 * UC-19 — "Cấu hình kênh chia sẻ tin tuyển dụng" (HR Admin,
 * `INTEGRATION_MANAGE`).
 *
 * Nằm chung nhóm Cài đặt Tích hợp với Calendar và Cloud Storage nhưng KHÔNG
 * có OAuth, không có Test Connection, không có badge trạng thái kết nối: chia
 * sẻ đi qua share intent link của chính nền tảng nên HireWise không giữ
 * credential nào của LinkedIn/Facebook. Ở đây chỉ có 2 thứ để chỉnh — bật/tắt
 * kênh, và giá trị `utm_source` gắn vào link.
 */
export function PublishingChannelsPage() {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: CHANNELS_QUERY_KEY,
    queryFn: listPublishingChannels,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">
          Kênh chia sẻ tin tuyển dụng
        </h1>
        <p className="text-sm text-neutral-500">
          Chọn những kênh Recruiter được phép chia sẻ tin tuyển dụng ra bên ngoài, và cách
          gắn nhãn nguồn để theo dõi ứng viên đến từ đâu.
        </p>
      </div>

      {isLoading && (
        <div className="shadow-elevation-1 bg-neutral-0 rounded-lg border border-neutral-200 p-5">
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-10 text-center text-sm text-neutral-600">
          Không tải được danh sách kênh chia sẻ. Kiểm tra lại quyền truy cập
          (INTEGRATION_MANAGE).
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-3">
          {data.map((channel) => (
            <ChannelCard
              // Key gồm cả 2 giá trị server đang giữ: sau khi lưu, query được
              // invalidate, key đổi và card remount với state nháp mới. Rẻ hơn
              // và ít bẫy hơn là đồng bộ prop vào state bằng useEffect.
              key={`${channel.code}:${String(channel.enabled)}:${channel.utmSource}`}
              channel={channel}
              onSaved={(updated) => {
                notify.success(`Đã lưu cấu hình kênh ${updated.name}.`);
                queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
              }}
            />
          ))}

          <p className="text-xs text-neutral-500">
            Tắt một kênh sẽ ẩn nó khỏi hộp thoại Chia sẻ của Recruiter. Số liệu đã thống
            kê trước đó vẫn được giữ nguyên.
          </p>
        </div>
      )}
    </div>
  );
}

interface ChannelCardProps {
  channel: PublishingChannel;
  onSaved: (channel: PublishingChannel) => void;
}

/**
 * Một kênh = một form nhỏ độc lập. Tách riêng thành component thay vì gom vào
 * một form lớn để mỗi kênh có state nháp của riêng nó — HR Admin sửa
 * `utm_source` của Facebook không làm mất thay đổi đang gõ dở ở LinkedIn.
 *
 * State nháp chỉ khởi tạo từ prop đúng 1 lần; nơi gọi chịu trách nhiệm đổi
 * `key` khi giá trị server thay đổi để card remount (xem chỗ render).
 */
function ChannelCard({ channel, onSaved }: ChannelCardProps) {
  const notify = useNotification();
  const [enabled, setEnabled] = useState(channel.enabled);
  const [utmSource, setUtmSource] = useState(channel.utmSource);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePublishingChannel(channel.code, { enabled, utmSource: utmSource.trim() }),
    onSuccess: (updated) => {
      setFieldError(null);
      onSaved(updated);
    },
    onError: (error) => {
      // 400 mang fieldErrors và không được apiClient tự toast — hiện ngay dưới ô nhập.
      if (error instanceof AppError && error.status === 400) {
        setFieldError(error.fieldErrors?.utmSource ?? error.message);
        return;
      }
      notify.error(error);
    },
  });

  const isDirty = enabled !== channel.enabled || utmSource.trim() !== channel.utmSource;

  return (
    <section className="shadow-elevation-1 bg-neutral-0 flex flex-col gap-4 rounded-lg border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-neutral-900">{channel.name}</h2>
          <p className="text-sm text-neutral-500">
            {PUBLISHING_CHANNEL_DESCRIPTIONS[channel.code]}
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          disabled={saveMutation.isPending}
          label={`Bật kênh ${channel.name}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Nguồn UTM"
          value={utmSource}
          disabled={saveMutation.isPending}
          error={fieldError ?? undefined}
          helperText="Gắn vào link chia sẻ dưới dạng ?utm_source=… để quy ứng viên về đúng kênh."
          onChange={(event) => {
            setUtmSource(event.target.value);
            if (fieldError) {
              setFieldError(null);
            }
          }}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-800">Link chia sẻ</span>
          <p
            className="truncate text-sm text-neutral-500"
            title={channel.shareIntentUrlTemplate ?? ''}
          >
            {channel.shareIntentUrlTemplate ?? 'Sao chép vào clipboard (không mở popup)'}
          </p>
          <span className="text-xs text-neutral-400">
            Do nền tảng quy định, không sửa được.
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!isDirty}
          isLoading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Lưu
        </Button>
      </div>
    </section>
  );
}
