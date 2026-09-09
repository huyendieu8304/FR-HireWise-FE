import { http } from '@/lib/apiClient';
import type { BookingPageResponse } from '../types';

const PUBLIC_CONFIG = { skipAuthRedirect: true, silent: true } as const;

/**
 * UC-34: Candidate views the public booking page.
 */
export function getBookingPage(token: string): Promise<BookingPageResponse> {
  return http.get<BookingPageResponse>(`/public/booking/${token}`, PUBLIC_CONFIG);
}
