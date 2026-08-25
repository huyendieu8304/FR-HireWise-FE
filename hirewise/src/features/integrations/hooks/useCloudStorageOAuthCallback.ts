import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fromProviderPathSegment } from '../types';
import type { CloudStorageProvider } from '../types';

/**
 * Kênh `postMessage` riêng giữa popup OAuth (cửa sổ mà backend 302 redirect
 * về sau khi Connect/Reconnect xong) và cửa sổ chính đã mở popup đó. Tiền tố
 * `hirewise:` để không đụng message của extension trình duyệt / thư viện khác.
 */
const OAUTH_MESSAGE_TYPE = 'hirewise:cloud-storage-oauth-result';

export interface CloudStorageOAuthResult {
  connected: boolean;
  provider: CloudStorageProvider | null;
}

interface OAuthMessage extends CloudStorageOAuthResult {
  type: typeof OAUTH_MESSAGE_TYPE;
}

function isOAuthMessage(data: unknown): data is OAuthMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === OAUTH_MESSAGE_TYPE
  );
}

/**
 * UC-07/UC-08: xử lý việc backend luôn 302 redirect thẳng về
 * `app.integration.frontend-redirect-url` sau khi 1 lượt Connect/Reconnect
 * kết thúc (thành công hay thất bại) — biến mặc định trỏ ĐÚNG VÀO route
 * `/settings/integrations` (xem `constants/routes.ts` và
 * `HireWise-BE/.env.example`), KHÔNG có route callback riêng nào khác. Vì
 * vậy chính trang `CloudStorageIntegrationPage` phải tự nhận diện 2 tình
 * huống mỗi khi mount và URL có kèm `?connected=...`:
 *
 * 1. Cửa sổ hiện tại LÀ popup đã mở lúc bấm Connect (`window.opener` tồn
 *    tại và khác chính nó): báo kết quả cho cửa sổ chính qua `postMessage`
 *    rồi tự đóng — không render UI đầy đủ (tránh nháy giao diện ngay trước
 *    khi popup đóng).
 * 2. KHÔNG phải popup (trình duyệt chặn popup nên toàn bộ luồng OAuth chạy
 *    ngay trên tab hiện tại thay vì popup): dọn query string (tránh xử lý
 *    lại nếu người dùng F5) rồi gọi `onResult` y như 1 lần "redirect
 *    thường" để trang tự hiển thị toast + refetch trạng thái.
 *
 * @param onResult gọi đúng 1 lần khi phát hiện được kết quả redirect — hàm
 *   này được lưu qua `ref` nội bộ nên KHÔNG cần bọc `useCallback` ở nơi gọi.
 */
export function useCloudStorageOAuthCallback(
  onResult: (result: CloudStorageOAuthResult) => void,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const onResultRef = useRef(onResult);

  const connectedParam = searchParams.get('connected');
  const isPopup =
    typeof window !== 'undefined' && Boolean(window.opener) && window.opener !== window;
  const isClosingPopup = connectedParam !== null && isPopup;

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (connectedParam === null) return;

    const connected = connectedParam === 'true';
    const provider = fromProviderPathSegment(searchParams.get('provider'));

    if (isPopup) {
      const message: OAuthMessage = { type: OAUTH_MESSAGE_TYPE, connected, provider };
      window.opener.postMessage(message, window.location.origin);
      // Đợi 1 nhịp ngắn để chắc chắn cửa sổ chính nhận được message trước khi đóng popup.
      const timer = window.setTimeout(() => window.close(), 400);
      return () => window.clearTimeout(timer);
    }

    setSearchParams({}, { replace: true });
    onResultRef.current({ connected, provider });
  }, [connectedParam, isPopup, searchParams, setSearchParams]);

  return { isClosingPopup };
}

/**
 * Lắng nghe kết quả OAuth do popup con báo về qua `postMessage` (xem
 * `useCloudStorageOAuthCallback`). Chỉ gọi ở cửa sổ CHÍNH — nơi bấm nút
 * Connect/Kết nối lại và mở popup, KHÔNG gọi trong chính popup đó.
 */
export function useCloudStorageOAuthResultListener(
  onResult: (result: CloudStorageOAuthResult) => void,
) {
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Chỉ tin message từ đúng origin của app (popup cùng origin vì cùng
      // domain FE) — bỏ qua message từ extension/iframe khác.
      if (event.origin !== window.location.origin) return;
      if (!isOAuthMessage(event.data)) return;
      onResultRef.current({
        connected: event.data.connected,
        provider: event.data.provider,
      });
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
}
