import { http } from '@/lib/apiClient';
import type {
  BookingConfirmResponse,
  BookingPageResponse,
  ConfirmBookingSlotRequest,
} from '../types';

const PUBLIC_CONFIG = { skipAuthRedirect: true, silent: true } as const;

/**
 * UC-34: Candidate views the public booking page.
 */
export function getBookingPage(token: string): Promise<BookingPageResponse> {
  return http.get<BookingPageResponse>(`/public/booking/${token}`, PUBLIC_CONFIG);
}

/**
 * UC-35: Candidate confirms their chosen booking slot.
 */
export function confirmBookingSlot(
  token: string,
  request: ConfirmBookingSlotRequest,
): Promise<BookingConfirmResponse> {
  return http.post<BookingConfirmResponse>(
    `/public/booking/${token}/confirm`,
    request,
    PUBLIC_CONFIG,
  );
}
