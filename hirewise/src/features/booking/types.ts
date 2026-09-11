import type { InterviewMode } from '../kanban/types';

export type BookingSlotStatus = 'OPEN' | 'HELD' | 'CONFIRMED' | 'BOOKED' | 'BUSY';

export interface BookingSlot {
  id: number;
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // HH:mm
  durationMinutes: number;
  status: BookingSlotStatus;
  available?: boolean;
  unavailableReason?: string;
}

export interface BookingPageResponse {
  bookingToken: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  mode: InterviewMode;
  locationOrLink?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  expiresAt: string;
  status: 'OPEN' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  slots: BookingSlot[];
}

export interface ConfirmBookingSlotRequest {
  slotId: number;
  notes?: string;
}

export interface BookingConfirmResponse {
  interviewId: string;
  interviewDate: string;
  interviewTime: string;
  durationMinutes: number;
  mode: InterviewMode;
  locationOrLink?: string;
  interviewerName: string;
  jobTitle: string;
  candidateName: string;
  message: string;
}
