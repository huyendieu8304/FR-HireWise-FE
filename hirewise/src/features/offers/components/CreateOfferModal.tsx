import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WarningCircle } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Select } from '@/components/ui/Select/Select';
import { NumberInput } from '@/components/ui/NumberInput/NumberInput';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { createOffer, listOfferTemplates } from '../api/offersApi';
import type { Offer } from '../types';

export interface CreateOfferModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  onCreated?: (offer: Offer) => void;
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
 */
export function CreateOfferModal({
  open,
  onClose,
  applicationId,
  candidateName,
  onCreated,
}: CreateOfferModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

  const [offerTemplateId, setOfferTemplateId] = useState<number | ''>('');
  const [salary, setSalary] = useState<number | null>(null);
  const [probationRate, setProbationRate] = useState<number | null>(DEFAULT_PROBATION_RATE);
  const [startDate, setStartDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['offer-templates', applicationId],
    queryFn: () => listOfferTemplates(applicationId),
    enabled: open,
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
      }),
    onSuccess: (offer) => {
      notify.success(`Đã tạo Offer nháp cho "${candidateName}". Xem lại nội dung rồi gửi cho ứng viên.`);
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

  return (
    <Modal
      open={open}
      onClose={() => !createMutation.isPending && handleClose()}
      title="Tạo thư mời làm việc"
      description={`Sinh Offer Letter cho "${candidateName}" từ mẫu có sẵn. Offer được lưu ở trạng thái Nháp, chưa gửi cho ứng viên.`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
            Hủy
          </Button>
          <Button
            isLoading={createMutation.isPending}
            disabled={!isSubmittable}
            onClick={() => createMutation.mutate()}
          >
            Tạo hợp đồng
          </Button>
        </>
      }
    >
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
    </Modal>
  );
}
