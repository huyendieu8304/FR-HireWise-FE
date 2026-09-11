import { http } from '@/lib/apiClient';
import type { BookingRequestResponse, SendBookingLinkRequest } from '../types';

/**
 * UC-25: Recruiter sends a self-service booking link to a candidate.
 */
export function sendBookingLink(
  applicationId: string,
  request: SendBookingLinkRequest,
): Promise<BookingRequestResponse> {
  return http.post<BookingRequestResponse>(
    `/applications/${applicationId}/booking-links`,
    request,
  );
}

/**
 * UC-25: Retrieves booking requests created for an application.
 */
export function getBookingRequests(
  applicationId: string,
): Promise<BookingRequestResponse[]> {
  return http.get<BookingRequestResponse[]>(
    `/applications/${applicationId}/booking-links`,
  );
}
