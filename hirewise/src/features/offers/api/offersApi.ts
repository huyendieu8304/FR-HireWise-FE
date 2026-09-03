import { http } from '@/lib/apiClient';
import type { CreateOfferRequest, Offer, OfferTemplate } from '../types';

/** UC-36 bước 2: các mẫu thư mời Recruiter được chọn cho Application này (dùng chung + theo phòng ban của Job). */
export function listOfferTemplates(applicationId: string): Promise<OfferTemplate[]> {
  return http.get<OfferTemplate[]>(`/applications/${applicationId}/offer-templates`);
}

/**
 * UC-36 main flow: tạo Offer nháp từ template. Backend validate Application
 * đang ở Stage Offer và chưa có Offer active nào khác (BR-OFFER-01), rồi
 * "đóng băng" nội dung đã render vào `renderedBody`.
 */
export function createOffer(applicationId: string, request: CreateOfferRequest): Promise<Offer> {
  return http.post<Offer>(`/applications/${applicationId}/offers`, request);
}

/** UC-37 bước 1: đọc lại 1 Offer để xem trước nội dung trước khi gửi. */
export function getOffer(offerId: string): Promise<Offer> {
  return http.get<Offer>(`/offers/${offerId}`);
}

/**
 * Offer mới nhất của Application (bất kể trạng thái) — Applicant Card dùng
 * để quyết định hiện nút [Tạo Offer] hay hiện trạng thái Offer hiện có.
 * Backend trả 204 khi chưa từng tạo Offer, khi đó `http.get` trả `null`.
 */
export function getLatestOffer(applicationId: string): Promise<Offer | null> {
  return http.get<Offer | null>(`/applications/${applicationId}/offers/latest`);
}

/**
 * UC-37 main flow: sinh liên kết bảo mật, chuyển Offer sang Sent và đẩy
 * email EM-11 vào outbox. Gọi lại trên Offer đã Sent chính là nút [Gửi lại]
 * của EX-01 — backend cấp lại secret mới cho cùng token row, nên link ở
 * email cũ sẽ ngừng hoạt động.
 */
export function sendOffer(offerId: string): Promise<Offer> {
  return http.post<Offer>(`/offers/${offerId}/send`);
}
