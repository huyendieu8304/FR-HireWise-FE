/**
 * Kiểu dữ liệu cho M18 — Offer & e-Signature (UC-36 → UC-39), khớp chính xác
 * theo DTO thật của backend (`HireWise-BE/.../dto/response/Offer*.java`,
 * `CreateOfferRequestDto.java`).
 */

/** Khớp `OfferStatus.java` (LV-21). ERD có thêm `VIEWED` nhưng SRS thì không — backend bỏ giá trị đó. */
export type OfferStatus =
  | 'DRAFT'
  | 'SENT'
  | 'SIGNED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: 'Nháp',
  SENT: 'Đã gửi',
  SIGNED: 'Đã ký',
  DECLINED: 'Ứng viên từ chối',
  EXPIRED: 'Hết hạn trả lời',
  CANCELLED: 'Đã thu hồi',
};

/** Khớp `OfferTemplateResponseDto.java` — nguồn cho dropdown ở UC-36 bước 2. */
export interface OfferTemplate {
  id: number;
  name: string;
  version: number;
  bodyTemplate: string;
  /** `null` = mẫu dùng chung toàn công ty. */
  departmentId: number | null;
}

/** Khớp `OfferResponseDto.java`. */
export interface Offer {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  offerTemplateId: number;
  offerTemplateName: string;
  salary: number;
  probationRate: number | null;
  startDate: string;
  expiresAt: string;
  status: OfferStatus;
  /** Bản render đã "đóng băng" tại thời điểm tạo Offer — không render lại khi đọc. */
  renderedBody: string;
  sentAt: string | null;
  signedAt: string | null;
  createdAt: string;
}

/** Khớp `CreateOfferRequestDto.java` (UC-36). */
export interface CreateOfferRequest {
  offerTemplateId: number;
  salary: number;
  /** Bỏ trống thì backend áp mặc định 85%. */
  probationRate?: number;
  /** ISO `YYYY-MM-DD`. */
  startDate: string;
  /** ISO instant. */
  expiresAt: string;
}
