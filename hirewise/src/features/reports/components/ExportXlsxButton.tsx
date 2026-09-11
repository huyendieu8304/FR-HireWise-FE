import { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';

export interface ExportXlsxButtonProps {
  /** Gọi endpoint export tương ứng, trả về file .xlsx dạng Blob. */
  download: () => Promise<Blob>;
  /** Tiền tố tên file, ví dụ `source-roi`. Ngày kết thúc báo cáo được nối vào sau. */
  fileNamePrefix: string;
  /** `toDate` backend trả về (`yyyy-MM-dd`) — dùng để đặt tên file. */
  toDate: string;
  /** Không cho bấm khi bảng đang rỗng: xuất ra file trắng chỉ gây khó hiểu. */
  disabled?: boolean;
}

/**
 * BR-RPT-03 / UC-42 REF 3 — nút [Export Excel] cho cả 2 tab báo cáo.
 *
 * File do backend dựng lại từ chính bộ lọc trên URL chứ không phải từ dữ liệu
 * đang có sẵn ở trình duyệt, nên nội dung file luôn nằm trong đúng phạm vi
 * người dùng được phép xem (BR-RPT-02).
 *
 * Tên file đặt ở phía client: header `Content-Disposition` bị response
 * interceptor của `apiClient` loại mất khi nó trả thẳng `response.data`.
 */
export function ExportXlsxButton({
  download,
  fileNamePrefix,
  toDate,
  disabled,
}: ExportXlsxButtonProps) {
  const notify = useNotification();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await download();
      saveBlob(blob, `${fileNamePrefix}-${toDate.replaceAll('-', '')}.xlsx`);
    } catch {
      // apiClient đã toast lỗi mạng/5xx; chỉ cần bổ sung ngữ cảnh cho các
      // trường hợp bị interceptor giữ im lặng (4xx nghiệp vụ).
      notify.error('Không tải được file báo cáo. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" size="md" onClick={handleExport} isLoading={isExporting} disabled={disabled}>
      <DownloadSimple className="size-4" />
      Export Excel
    </Button>
  );
}

/**
 * Tải Blob về máy qua thẻ `<a download>` tạm.
 *
 * Dùng `<a download>` chứ không `window.open` như luồng tải CV: mở tab mới với
 * blob .xlsx chỉ cho ra một tab trắng, trình duyệt không render được định dạng
 * này. Object URL được thu hồi sau khi trình duyệt kịp bắt đầu tải.
 */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
