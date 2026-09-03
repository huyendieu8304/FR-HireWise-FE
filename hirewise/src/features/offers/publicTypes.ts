/**
 * Kiểu dữ liệu cho phần ứng viên của M18 (UC-38, UC-39), khớp theo
 * `PublicOfferSummaryDto.java`, `PublicOfferContentDto.java`,
 * `VerifyOfferOtpRequestDto.java` và `SignOfferRequestDto.java`.
 */

import type { OfferStatus } from './types';

/** Khớp `SignatureMethod.java` (LV-22). */
export type SignatureMethod = 'DRAW' | 'TYPE';

/**
 * UC-38 bước 1 — những gì ứng viên được thấy TRƯỚC khi xác thực OTP.
 * BR-OFFER-03: cố tình không có lương, ngày nhận việc hay nội dung hợp đồng.
 */
export interface PublicOfferSummary {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  /** Đã mask — trang này ai cầm link cũng mở được. */
  maskedEmail: string;
  expiresAt: string;
  status: OfferStatus;
  otpVerified: boolean;
}

/** UC-38 bước 4-5 — toàn bộ điều khoản, chỉ trả về sau khi OTP hợp lệ. */
export interface PublicOfferContent {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  salary: number;
  probationRate: number | null;
  startDate: string;
  expiresAt: string;
  status: OfferStatus;
  renderedBody: string;
  signed: boolean;
  signedAt: string | null;
}

/** Khớp `SignOfferRequestDto.java` (UC-39). */
export interface SignOfferRequest {
  method: SignatureMethod;
  /** `data:image/png;base64,...` — bắt buộc khi method = DRAW. */
  signatureImageBase64?: string;
  /** Bắt buộc khi method = TYPE. */
  typedName?: string;
}
