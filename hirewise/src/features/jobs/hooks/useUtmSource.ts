import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'hirewise-utm-source';

/**
 * UC-32: nhớ `utm_source` của link chia sẻ đã dẫn ứng viên tới, để gửi kèm
 * khi họ nộp hồ sơ.
 *
 * Cần lưu lại chứ không đọc thẳng từ URL vì ứng viên hiếm khi nộp ngay trên
 * trang họ vừa mở — thường là bấm vào tin, đọc JD, chuyển sang trang ứng
 * tuyển, có khi mở thêm vài tin khác. Query param biến mất từ lần điều hướng
 * đầu tiên, nên nếu chỉ đọc `useSearchParams` thì gần như mọi hồ sơ đều bị
 * ghi nhận là "vào thẳng Job Board".
 *
 * Dùng `sessionStorage` chứ không phải `localStorage`: attribution chỉ nên
 * sống trong phiên duyệt web hiện tại. Nếu người dùng quay lại sau vài ngày
 * qua Google, hồ sơ đó không còn là công của LinkedIn nữa.
 *
 * Mọi truy cập đều bọc try/catch — trình duyệt ở chế độ riêng tư hoặc chặn
 * site data sẽ ném ngay ở dòng đọc/ghi, và mất attribution thì không đáng để
 * làm hỏng luồng nộp hồ sơ.
 *
 * @returns utm_source đã ghi nhận, hoặc `undefined` nếu ứng viên vào trực tiếp
 */
export function useUtmSource(): string | undefined {
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('utm_source') ?? undefined;
  // Đọc storage đúng 1 lần lúc mount. Giá trị này không đổi trong suốt vòng
  // đời trang nên không cần state phái sinh, và tránh được setState-in-effect.
  const [stored] = useState<string | undefined>(readStored);

  useEffect(() => {
    if (!fromUrl) {
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      // Trình duyệt chặn site data — vẫn dùng được giá trị từ URL cho lần nộp này.
    }
  }, [fromUrl]);

  // Link vừa mở luôn thắng giá trị đã lưu: kênh gần nhất mới là kênh thực sự
  // đưa ứng viên tới trang này.
  return fromUrl ?? stored;
}

function readStored(): string | undefined {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
