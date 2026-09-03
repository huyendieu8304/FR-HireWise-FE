import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fromCalendarProviderPathSegment } from '../types';
import type { CalendarProvider } from '../types';

/**
 * Kênh `postMessage` riêng cho Calendar OAuth (UC-18). Tiền tố
 * `hirewise:` để không đụng message của extension / thư viện khác.
 */
const OAUTH_MESSAGE_TYPE = 'hirewise:calendar-oauth-result';

export interface CalendarOAuthResult {
  connected: boolean;
  provider: CalendarProvider | null;
}

interface OAuthMessage extends CalendarOAuthResult {
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
 * UC-18: xử lý việc backend luôn 302 redirect thẳng về
 * `app.integration.calendar-frontend-redirect-url` sau khi 1 lượt Connect
 * kết thúc (thành công hay thất bại). Trang Calendar (`CalendarIntegrationPage`)
 * đóng vai trò kép: vừa là màn hình chính, vừa là nơi popup OAuth "hạ cánh".
 *
 * 2 tình huống khi mount và URL có kèm `?connected=...`:
 *
 * 1. Cửa sổ hiện tại LÀ popup: báo kết quả cho cửa sổ chính qua `postMessage`
 *    rồi tự đóng.
 * 2. KHÔNG phải popup (trình duyệt chặn popup, luồng OAuth chạy trên tab
 *    hiện tại): dọn query string rồi gọi `onResult`.
 *
 * @param onResult gọi đúng 1 lần khi phát hiện kết quả redirect — không cần
 *   `useCallback` ở nơi gọi vì hook lưu nội bộ qua `ref`.
 */
export function useCalendarOAuthCallback(
    onResult: (result: CalendarOAuthResult) => void,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const connectedParam = searchParams.get('connected');

  const isPopup =
      typeof window !== 'undefined' && Boolean(window.opener) && window.opener !== window;
  const isClosingPopup = connectedParam !== null && isPopup;

  useEffect(() => {
    if (connectedParam === null) return;

    const connected = connectedParam === 'true';
    const provider = fromCalendarProviderPathSegment(searchParams.get('provider'));

    if (isPopup) {
      const message: OAuthMessage = { type: OAUTH_MESSAGE_TYPE, connected, provider };
      window.opener.postMessage(message, window.location.origin);
      // Nhỏ chút delay để cửa sổ chính nhận được message trước khi popup đóng.
      const timer = window.setTimeout(() => window.close(), 400);
      return () => window.clearTimeout(timer);
    }

    setSearchParams({}, { replace: true });
    onResultRef.current({ connected, provider });
  }, [connectedParam, isPopup, searchParams, setSearchParams]);

  return { isClosingPopup };
}

/**
 * Lắng nghe kết quả OAuth do popup Calendar báo về qua `postMessage`.
 * Chỉ gọi ở cửa sổ CHÍNH — nơi mở popup, KHÔNG gọi trong chính popup đó.
 */
export function useCalendarOAuthResultListener(
    onResult: (result: CalendarOAuthResult) => void,
) {
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
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
