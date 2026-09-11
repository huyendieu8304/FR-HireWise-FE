import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Copy,
  FacebookLogo,
  LinkedinLogo,
  LinkSimple,
  ShareNetwork,
  XLogo,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useNotification } from '@/hooks/useNotification';
import { formatDateTime } from '@/utils/formatters';
import { getShareTargets, notifyShareSummary, recordShare } from '../api/jobShareApi';
import type { InternalJobDetail, PublishingChannelCode, ShareTarget } from '../types';

export interface ShareJobModalProps {
  open: boolean;
  onClose: () => void;
  job: InternalJobDetail;
}

const CHANNEL_ICONS: Record<PublishingChannelCode, typeof LinkedinLogo> = {
  LINKEDIN: LinkedinLogo,
  FACEBOOK: FacebookLogo,
  X: XLogo,
  COPY_LINK: LinkSimple,
};

/** Mở popup share intent căn giữa màn hình. Trả `null` nếu bị trình duyệt chặn. */
function openSharePopup(url: string): Window | null {
  const width = 600;
  const height = 700;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  return window.open(
    url,
    'hirewise-share',
    `width=${width},height=${height},left=${left},top=${top}`,
  );
}

/**
 * UC-31 — "Chia sẻ tin tuyển dụng ra kênh ngoài".
 *
 * Bấm một kênh sẽ mở popup share intent của chính nền tảng đó (LinkedIn,
 * Facebook, X) với link do backend dựng. HireWise không tự đăng bài — cả hai
 * nền tảng đều bắt buộc App Review đã duyệt mới cho đăng qua API.
 *
 * Hệ quả cần biết khi đọc màn hình này: popup là của nền tảng nên ta không
 * thể biết người dùng có bấm Đăng thật hay đóng cửa sổ. Vì vậy "lượt chia
 * sẻ" chỉ đếm số lần bấm nút; con số phản ánh độ phủ thật là "lượt xem" ở
 * panel UC-32, vốn chỉ tăng khi có người thật mở link.
 *
 * Khối preview ở đầu modal chính là bài đăng sẽ hiện ra: LinkedIn và Facebook
 * đều bỏ qua mọi caption truyền vào và dựng thẻ hoàn toàn từ Open Graph.
 */
export function ShareJobModal({ open, onClose, job }: ShareJobModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<PublishingChannelCode | null>(null);
  // Chỉ gửi EM-10 nếu phiên mở modal này thực sự có chia sẻ. Dùng ref chứ
  // không phải state vì giá trị chỉ được đọc lúc đóng modal, không render ra.
  const sharedInThisSession = useRef(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['jobs', 'share-targets', job.id],
    queryFn: () => getShareTargets(job.id),
    enabled: open,
  });

  const recordMutation = useMutation({
    mutationFn: (code: PublishingChannelCode) => recordShare(job.id, code),
    onSuccess: () => {
      sharedInThisSession.current = true;
      queryClient.invalidateQueries({ queryKey: ['jobs', 'share-targets', job.id] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'share-stats', job.id] });
    },
    // Popup đã mở rồi mới ghi nhận, nên lỗi ở đây chỉ làm sai con số thống kê
    // chứ không chặn việc chia sẻ — báo nhẹ, không dựng cờ đỏ.
    onError: () => notify.warning('Không ghi nhận được lượt chia sẻ này vào thống kê.'),
  });

  const notifyMutation = useMutation({
    mutationFn: () => notifyShareSummary(job.id),
  });

  function handleClose() {
    if (sharedInThisSession.current) {
      notifyMutation.mutate();
      sharedInThisSession.current = false;
    }
    setCopiedCode(null);
    onClose();
  }

  function handleShare(target: ShareTarget) {
    if (!target.intentUrl) {
      handleCopy(target);
      return;
    }
    const popup = openSharePopup(target.intentUrl);
    if (!popup) {
      notify.error(
        'Trình duyệt đã chặn cửa sổ chia sẻ. Vui lòng cho phép popup rồi thử lại.',
      );
      return;
    }
    recordMutation.mutate(target.code);
  }

  async function handleCopy(target: ShareTarget) {
    try {
      await navigator.clipboard.writeText(target.shareUrl);
      setCopiedCode(target.code);
      notify.success('Đã sao chép link chia sẻ.');
      recordMutation.mutate(target.code);
    } catch {
      // clipboard API cần HTTPS hoặc localhost; ngoài hai môi trường đó thì
      // trình duyệt từ chối và người dùng phải tự copy từ ô link.
      notify.error('Không sao chép được. Vui lòng copy thủ công link bên dưới.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Chia sẻ tin tuyển dụng"
      description={`Đăng "${job.title}" lên trang cá nhân hoặc trang công ty của bạn trên các nền tảng bên ngoài.`}
      size="md"
      footer={
        <Button variant="outline" onClick={handleClose}>
          Đóng
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {isLoading && <Skeleton className="h-48 w-full" />}

        {isError && (
          <p className="bg-danger-50 text-danger-700 rounded-md px-3 py-2 text-sm">
            {error instanceof Error
              ? error.message
              : 'Không tải được danh sách kênh chia sẻ.'}
          </p>
        )}

        {data && (
          <>
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-neutral-800">
                Bài đăng sẽ hiển thị như sau
              </h3>
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <img
                  src={data.preview.imageUrl}
                  alt=""
                  className="h-32 w-full bg-neutral-100 object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex flex-col gap-1 bg-neutral-50 px-3 py-2.5">
                  <span className="text-xs tracking-wide text-neutral-500 uppercase">
                    {data.preview.siteName}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {data.preview.title}
                  </span>
                  {data.preview.description && (
                    <span className="line-clamp-2 text-xs text-neutral-600">
                      {data.preview.description}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                LinkedIn và Facebook dựng thẻ này từ dữ liệu của tin tuyển dụng, không cho
                phép thêm caption riêng.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-neutral-800">Chọn kênh</h3>

              {data.channels.length === 0 ? (
                <p className="rounded-md bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">
                  Chưa có kênh chia sẻ nào được bật. HR Admin có thể bật kênh trong Cài
                  đặt → Kênh chia sẻ.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.channels.map((target) => {
                    const Icon = CHANNEL_ICONS[target.code] ?? ShareNetwork;
                    const isCopyChannel = target.intentUrl === null;
                    const justCopied = copiedCode === target.code;
                    return (
                      <li
                        key={target.code}
                        className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Icon
                            className="size-5 shrink-0 text-neutral-600"
                            weight="fill"
                          />
                          <div className="flex min-w-0 flex-col">
                            <span className="text-sm font-medium text-neutral-900">
                              {target.name}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {target.shareCount > 0
                                ? `${target.shareCount} lượt chia sẻ · lần cuối ${formatDateTime(target.lastSharedAt)}`
                                : 'Chưa chia sẻ lần nào'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={isCopyChannel ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleShare(target)}
                        >
                          {isCopyChannel ? (
                            <>
                              {justCopied ? (
                                <Check className="size-4" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                              {justCopied ? 'Đã chép' : 'Sao chép'}
                            </>
                          ) : (
                            <>
                              <ShareNetwork className="size-4" />
                              Chia sẻ
                            </>
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
