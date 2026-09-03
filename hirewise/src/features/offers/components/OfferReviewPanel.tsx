import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, PaperPlaneTilt, Warning } from '@phosphor-icons/react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { useDialog } from '@/hooks/useDialog';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { sendOffer } from '../api/offersApi';
import { OFFER_STATUS_LABELS, type Offer } from '../types';

export interface OfferReviewPanelProps {
  offer: Offer;
  /** UI-only gate — backend luôn kiểm tra lại OFFER_SEND + ownership Layer 4. */
  canSend: boolean;
}

const STATUS_BADGE_VARIANT: Record<Offer['status'], BadgeVariant> = {
  DRAFT: 'neutral',
  SENT: 'warning',
  SIGNED: 'success',
  DECLINED: 'danger',
  EXPIRED: 'danger',
  CANCELLED: 'neutral',
};

/**
 * UC-37 — màn hình "Offer Review & Send": xem trước nội dung Offer đã render
 * rồi bấm [Gửi Offer] để sinh liên kết bảo mật và gửi email EM-11 kèm yêu
 * cầu ký điện tử.
 *
 * Nội dung hiển thị là `renderedBody` đã "đóng băng" từ lúc tạo (UC-36 bước
 * 5) — không render lại từ template, để những gì ứng viên đọc và ký đúng
 * bằng những gì Recruiter duyệt ở đây (BR-OFFER-04).
 */
export function OfferReviewPanel({ offer, canSend }: OfferReviewPanelProps) {
  const notify = useNotification();
  const dialog = useDialog();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: () => sendOffer(offer.id),
    onSuccess: () => {
      notify.success('Đã gửi liên kết Offer kèm yêu cầu ký điện tử cho ứng viên.');
      queryClient.invalidateQueries({ queryKey: ['offers', 'latest', offer.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', offer.applicationId] });
    },
    // EX-01: gửi email lỗi thì outbox tự retry, backend vẫn trả 200. Lỗi ở
    // đây là Offer đã hết hạn/đã ký hoặc sai quyền — apiClient đã tự toast.
    onError: (error) => {
      notify.error(error);
    },
  });

  const isResend = offer.status === 'SENT';

  async function handleSend() {
    const confirmed = await dialog.confirm({
      title: isResend ? 'Gửi lại Offer' : 'Gửi Offer cho ứng viên',
      description: isResend
        ? 'Hệ thống sẽ cấp liên kết mới cho ứng viên. Liên kết trong email đã gửi trước đó sẽ ngừng hoạt động.'
        : `Ứng viên "${offer.candidateName}" sẽ nhận email kèm liên kết bảo mật và phải xác thực OTP trước khi xem nội dung hợp đồng.`,
      confirmLabel: isResend ? 'Gửi lại' : 'Gửi Offer',
    });
    if (confirmed) {
      sendMutation.mutate();
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-neutral-900">Thư mời làm việc</h2>
          <Badge variant={STATUS_BADGE_VARIANT[offer.status]}>
            {OFFER_STATUS_LABELS[offer.status]}
          </Badge>
        </div>

        {canSend && (offer.status === 'DRAFT' || offer.status === 'SENT') && (
          <Button isLoading={sendMutation.isPending} onClick={handleSend}>
            <PaperPlaneTilt className="size-4" />
            {isResend ? 'Gửi lại Offer' : 'Gửi Offer'}
          </Button>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-neutral-500">Mẫu áp dụng</dt>
          <dd className="font-medium text-neutral-900">{offer.offerTemplateName}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-neutral-500">Ngày nhận việc</dt>
          <dd className="font-medium text-neutral-900">{formatDate(offer.startDate)}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-neutral-500">Hạn trả lời</dt>
          <dd className="font-medium text-neutral-900">{formatDateTime(offer.expiresAt)}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-neutral-500">Đã gửi lúc</dt>
          <dd className="font-medium text-neutral-900">
            {offer.sentAt ? formatDateTime(offer.sentAt) : '—'}
          </dd>
        </div>
      </dl>

      {offer.status === 'SENT' && (
        <p className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <span>
            Đang chờ ứng viên xác thực OTP và ký điện tử. Quá hạn trả lời mà chưa ký, Offer tự
            chuyển sang Hết hạn (BR-OFFER-02).
          </span>
        </p>
      )}

      {offer.status === 'SIGNED' && offer.signedAt && (
        <p className="flex items-start gap-2 rounded-md border border-success-200 bg-success-50 p-3 text-xs text-success-800">
          <CheckCircle className="mt-0.5 size-4 shrink-0" />
          <span>Ứng viên đã ký lúc {formatDateTime(offer.signedAt)}.</span>
        </p>
      )}

      {offer.status === 'EXPIRED' && (
        <p className="flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-800">
          <Warning className="mt-0.5 size-4 shrink-0" />
          <span>Offer đã quá hạn trả lời mà ứng viên chưa ký. Tạo Offer mới nếu vẫn muốn mời.</span>
        </p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-800">Xem trước nội dung</h3>
        {/*
          Nội dung do backend render và đã HTML-escape mọi giá trị thay vào
          template (xem OfferTemplateRenderer) — phần HTML còn lại là khung
          cố định do HR soạn trong offer_templates, không phải dữ liệu ứng
          viên nhập, nên hiển thị trực tiếp là an toàn.
        */}
        <div
          className="max-h-96 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800"
          dangerouslySetInnerHTML={{ __html: offer.renderedBody }}
        />
      </div>
    </section>
  );
}
