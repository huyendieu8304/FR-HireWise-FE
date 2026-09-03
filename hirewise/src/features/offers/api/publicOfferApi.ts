import { http } from '@/lib/apiClient';
import type {
  PublicOfferContent,
  PublicOfferSummary,
  SignOfferRequest,
} from '../publicTypes';

/**
 * API phía ứng viên cho UC-38/UC-39.
 *
 * Ứng viên KHÔNG có tài khoản trong hệ thống (SRS mục 3.1) nên mọi request ở
 * đây phải đi kèm `skipAuthRedirect: true`: cờ này vừa ngăn interceptor gắn
 * Bearer token cũ trong localStorage (Spring Security chặn ngay từ filter
 * nếu token hết hạn, kể cả với endpoint permitAll), vừa ngăn app tự đá về
 * trang login khi backend trả 401/403. Xác thực ở đây là link token + OTP.
 *
 * `silent: true` để component tự hiển thị lỗi inline (ME-32/ME-33) thay vì
 * bắn toast đỏ toàn cục cho ứng viên.
 */
const PUBLIC_CONFIG = { skipAuthRedirect: true, silent: true } as const;

/** UC-38 bước 1: thông tin tối thiểu, chưa gồm điều khoản hợp đồng. */
export function getPublicOfferSummary(token: string): Promise<PublicOfferSummary> {
  return http.get<PublicOfferSummary>(`/public/offers/${token}`, PUBLIC_CONFIG);
}

/** UC-38 bước 2: gửi mã OTP 6 số tới email ứng viên. Cũng là nút "Gửi lại mã". */
export function requestOfferOtp(token: string): Promise<void> {
  return http.post<void>(`/public/offers/${token}/otp`, undefined, PUBLIC_CONFIG);
}

/** UC-38 bước 3-5: xác thực OTP và nhận toàn bộ nội dung hợp đồng. */
export function verifyOfferOtp(token: string, code: string): Promise<PublicOfferContent> {
  return http.post<PublicOfferContent>(
    `/public/offers/${token}/otp/verify`,
    { code },
    PUBLIC_CONFIG,
  );
}

/** UC-38 bước 5 khi tải lại trang: lấy lại nội dung nếu còn trong cửa sổ xem. */
export function getPublicOfferContent(token: string): Promise<PublicOfferContent> {
  return http.get<PublicOfferContent>(`/public/offers/${token}/content`, PUBLIC_CONFIG);
}

/**
 * UC-39 main flow: ký điện tử. Backend sinh PDF đã đóng dấu chữ ký, ghi bằng
 * chứng ký, khóa Offer và tự chuyển Application sang Hired (BR-OFFER-04).
 */
export function signOffer(token: string, request: SignOfferRequest): Promise<PublicOfferContent> {
  return http.post<PublicOfferContent>(`/public/offers/${token}/sign`, request, PUBLIC_CONFIG);
}
