import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WarningCircle } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Select } from '@/components/ui/Select/Select';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { moveApplicationStage } from '@/features/kanban/api/kanbanApi';
import { createOffer, getLatestOffer, listOfferTemplates } from '../api/offersApi';
import type { Offer } from '../types';

export interface CreateOfferModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  /**
   * UC-23: id Stage của cột Offer khi modal được mở từ thao tác kéo-thả trên
   * Kanban. Bỏ trống là luồng nút [Tạo Offer] trong Applicant Card — hồ sơ
   * khi đó đã ở Stage Offer sẵn nên không có gì để chuyển.
   */
  targetStageId?: number;
  /** Tên cột đích, chỉ để hiển thị trong mô tả khi mở từ Kanban. */
  targetStageName?: string;
  onCreated?: (offer: Offer) => void;
  /**
   * UC-23: hồ sơ đã có Offer active nên chỉ chuyển được Stage, không tạo thêm
   * Offer nào (BR-OFFER-01). Tách khỏi `onCreated` vì không có Offer nào ra đời.
   */
  onStageMoved?: () => void;
}

/** UC-36 Screen Description ô số 3: bỏ trống thì backend áp mặc định 85%. */
const DEFAULT_PROBATION_RATE = 85;

/**
 * UC-36 main flow — màn hình "Offer Creation Form": chọn mẫu thư mời, nhập
 * lương chính thức, tỷ lệ thử việc, ngày nhận việc và hạn trả lời, rồi tạo
 * Offer ở trạng thái Nháp. Chưa có gì gửi tới ứng viên ở bước này — việc gửi
 * là UC-37, thực hiện từ panel xem trước sau khi tạo xong.
 *
 * BR-OFFER-01: mỗi Application chỉ có tối đa 1 Offer active; backend chặn
 * (EX-01) nếu đã có Offer ở trạng thái Nháp/Đã gửi.
 *
 * UC-23: cũng là dialog bắt buộc khi kéo thẻ sang cột Offer trên Kanban. Ở
 * luồng đó `targetStageId` được truyền xuống backend để việc chuyển Stage và
 * việc tạo Offer nằm trong CÙNG 1 transaction — bấm Hủy là không có gì được
 * ghi nhận, hồ sơ ở nguyên Stage cũ.
 */
export function CreateOfferModal({
  open,
  onClose,
  applicationId,
  candidateName,
  targetStageId,
  targetStageName,
  onCreated,
  onStageMoved,
}: CreateOfferModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const [offerTemplateId, setOfferTemplateId] = useState<number | ''>('');
  const [salary, setSalary] = useState<number | null>(null);
  const [probationRate, setProbationRate] = useState<number | null>(DEFAULT_PROBATION_RATE);
  const [startDate, setStartDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // UC-23: mở từ Kanban thì chưa biết hồ sơ đã có Offer active hay chưa —
  // ApplicantCardPage biết vì nó hỏi sẵn, còn board thì không. Hỏi ở đây để
  // hiện lối thoát tử tế thay vì đâm thẳng vào 409 OFFER_ALREADY_ACTIVE.
  const isFromKanban = targetStageId !== undefined;
  const { data: latestOffer, isLoading: isLoadingLatestOffer } = useQuery({
    queryKey: ['offers', 'latest', applicationId],
    queryFn: () => getLatestOffer(applicationId),
    enabled: open && isFromKanban,
  });
  const hasActiveOffer = latestOffer?.status === 'DRAFT' || latestOffer?.status === 'SENT';

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['offer-templates', applicationId],
    queryFn: () => listOfferTemplates(applicationId),
    enabled: open && !hasActiveOffer,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createOffer(applicationId, {
        offerTemplateId: offerTemplateId as number,
        salary: salary as number,
        probationRate: probationRate ?? undefined,
        startDate,
        // DatePicker 'datetime-local' trả giờ local không có timezone; đổi
        // sang ISO instant để khớp kiểu Instant của backend.
        expiresAt: new Date(expiresAt).toISOString(),
        targetStageId,
      }),
    onSuccess: (offer) => {
      notify.success(
        isFromKanban
          ? `Đã tạo Offer nháp cho "${candidateName}" và chuyển sang Stage "${targetStageName}".`
          : `Đã tạo Offer nháp cho "${candidateName}". Xem lại nội dung rồi gửi cho ứng viên.`,
      );
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['offers', 'latest', applicationId] });
      handleClose();
      onCreated?.(offer);
    },
    // EX-01 (BR-OFFER-01): đã có Offer active, Application chưa vào Stage
    // Offer, hoặc không đúng quyền sở hữu Job — apiClient đã tự toast.
    onError: (error) => {
      notify.error(error);
    },
  });

  // UC-23 lối thoát cho hồ sơ đã có Offer active: không tạo thêm Offer nào
  // (BR-OFFER-01 cấm), chỉ chuyển Stage như thao tác kéo-thả thông thường.
  const moveOnlyMutation = useMutation({
    // Chỉ bấm được từ luồng Kanban (nhánh `hasActiveOffer`), nơi luôn có
    // `targetStageId` — nút này không tồn tại ở luồng Applicant Card.
    mutationFn: () => moveApplicationStage(applicationId, targetStageId!),
    onSuccess: () => {
      notify.success(`Đã chuyển "${candidateName}" sang Stage "${targetStageName}".`);
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
      handleClose();
      onStageMoved?.();
    },
    onError: (error) => {
      notify.error(error);
    },
  });

  const isPending = createMutation.isPending || moveOnlyMutation.isPending;

  function handleClose() {
    setOfferTemplateId('');
    setSalary(null);
    setProbationRate(DEFAULT_PROBATION_RATE);
    setStartDate('');
    setExpiresAt('');
    onClose();
  }

  const isSubmittable =
    offerTemplateId !== '' && salary !== null && salary > 0 && startDate !== '' && expiresAt !== '';

  // UC-23: mở từ Kanban thì Hủy phải nói rõ hồ sơ đứng yên, vì người dùng vừa
  // thả thẻ sang cột khác và đang chờ xem nó có ở lại đó không.
  const description = isFromKanban
    ? `Sinh Offer Letter cho "${candidateName}" rồi chuyển sang Stage "${targetStageName}". Hủy thì hồ sơ giữ nguyên Stage hiện tại.`
    : `Sinh Offer Letter cho "${candidateName}" từ mẫu có sẵn. Offer được lưu ở trạng thái Nháp, chưa gửi cho ứng viên.`;

  return (
    <Modal
      open={open}
      onClose={() => !isPending && handleClose()}
      title="Tạo thư mời làm việc"
      description={description}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          {hasActiveOffer ? (
            <Button
              isLoading={moveOnlyMutation.isPending}
              onClick={() => moveOnlyMutation.mutate()}
            >
              Chuyển sang Stage Offer
            </Button>
          ) : (
            <Button
              isLoading={createMutation.isPending}
              disabled={!isSubmittable || isLoadingLatestOffer}
              onClick={() => createMutation.mutate()}
            >
              Tạo hợp đồng
            </Button>
          )}
        </>
      }
    >
      {hasActiveOffer ? (
        // BR-OFFER-01/EX-01: hồ sơ đã có Offer Nháp/Đã gửi nên không tạo thêm
        // được nữa. Thay vì để người dùng điền hết form rồi ăn 409, chỉ còn
        // việc chuyển Stage — Offer cũ xem/gửi lại trong Applicant Card.
        <div className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
          <WarningCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {`"${candidateName}" đã có một Offer ở trạng thái ${
              latestOffer?.status === 'DRAFT' ? 'Nháp' : 'Đã gửi'
            }, mỗi hồ sơ chỉ được có tối đa 1 Offer đang hiệu lực. Bạn có thể chuyển hồ sơ sang Stage "${targetStageName}" rồi mở Applicant Card để xem lại hoặc gửi Offer đó.`}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="Mẫu thư mời"
            placeholder={isLoadingTemplates ? 'Đang tải...' : 'Chọn mẫu thư mời'}
            required
            disabled={isLoadingTemplates}
            options={(templates ?? []).map((t) => ({
              value: String(t.id),
              label: `${t.name} (v${t.version})`,
            }))}
            value={offerTemplateId === '' ? '' : String(offerTemplateId)}
            onChange={(e) => setOfferTemplateId(e.target.value ? Number(e.target.value) : '')}
          />

          {!isLoadingTemplates && (templates ?? []).length === 0 && (
            <div className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
              <WarningCircle className="mt-0.5 size-4 shrink-0" />
              <span>Chưa có mẫu thư mời nào khả dụng. Liên hệ quản trị hệ thống.</span>
            </div>
          )}

          <NumberInput
            label="Lương chính thức"
            required
            value={salary}
            onChange={setSalary}
            min={0}
            currencySymbol="₫"
            placeholder="25.000.000"
          />

          <NumberInput
            label="Tỷ lệ thử việc (%)"
            helperText="Không bắt buộc — bỏ trống hệ thống áp mặc định 85%."
            value={probationRate}
            onChange={setProbationRate}
            min={1}
            max={100}
          />

          <DatePicker
            label="Ngày nhận việc"
            required
            mode="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <DatePicker
            label="Hạn trả lời"
            required
            mode="datetime-local"
            helperText="Quá hạn mà ứng viên chưa ký, Offer tự chuyển sang Hết hạn (BR-OFFER-02). Phải trước ngày nhận việc."
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      )}
    </Modal>
  );
}
