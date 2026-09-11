import { http } from '@/lib/apiClient';
import type {
  InterviewCalendarItem,
  InterviewerOption,
  ScheduleInterviewRequest,
  ScheduleInterviewResponse,
} from '../types';

/**
 * UC-24: Đặt lịch phỏng vấn cứng cho ứng viên, gán interviewer, chuyển stage
 * sang INTERVIEW và tự động gửi email mời cho ứng viên (EM-05) và interviewer (EM-08).
 */
export function scheduleInterview(
  applicationId: string,
  request: ScheduleInterviewRequest,
): Promise<ScheduleInterviewResponse> {
  return http.post<ScheduleInterviewResponse>(
    `/applications/${applicationId}/interviews`,
    request,
  );
}

/**
 * UC-24: Lấy danh sách interviewer đang ACTIVE để lựa chọn trong popup lên lịch.
 */
export function getAvailableInterviewers(): Promise<InterviewerOption[]> {
  return http.get<InterviewerOption[]>('/applications/interviewers');
}

/**
 * UC-24: Lấy danh sách các buổi phỏng vấn đã được xếp lịch trong một khoảng thời gian.
 */
export function getInterviewCalendar(
  startDate: string,
  endDate: string,
): Promise<InterviewCalendarItem[]> {
  return http.get<InterviewCalendarItem[]>('/applications/interviews/calendar', {
    params: { startDate, endDate },
  });
}

export interface InterviewerBusySlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

/**
 * UC-25: Lấy danh sách các khung giờ bận của interviewer trong khoảng thời gian đã chọn.
 */
export function getInterviewerBusySlots(
  interviewerId: number,
  startDate: string,
  endDate: string,
): Promise<InterviewerBusySlot[]> {
  return http.get<InterviewerBusySlot[]>(`/applications/interviewers/${interviewerId}/busy-slots`, {
    params: { startDate, endDate },
  });
}

