import { Code } from '@phosphor-icons/react';

/**
 * Danh sach bien dong ho tro (BR-EMAILTPL-02 / UC-10).
 * Khop chinh xac voi SUPPORTED_VARIABLES trong TemplateVariableValidator.java (BE).
 */
export const SUPPORTED_VARIABLES = [
  // Ung vien
  'Candidate_Name',
  'Full_Name',
  // Tuyen dung / Job
  'Job_Title',
  'Company',
  'Department_Name',
  'Openings',
  'Role_Name',
  // Nguoi dung he thong
  'Recruiter_Name',
  'Manager_Name',
  'Interviewer_Name',
  // Phong van
  'Interview_Date',
  'Interview_Time',
  'Interview_Mode',
  'Meeting_Location_Or_Link',
  'Confirm_Link',
  'Booking_Link',
  'Expiry_Hours',
  'Scorecard_Link',
  'Candidate_Profile_Link',
  // Offer / Onboarding
  'Offer_Link',
  'Expiry_Date',
  'Signed_At',
  'Signed_File_Link',
  'Start_Date',
  // Link / Phe duyet
  'Activation_Link',
  'Job_Approval_Link',
  'Job_Link',
  'Dashboard_Link',
  // Noi dung dong
  'Decision',
  'Applied_At',
  'Reject_Reason_Block',
  'Custom_Message_Block',
  'Channel_Status_List',
  'Breach_List',
  // SLA / He thong
  'n',
  'Stage_Name',
] as const;

export type SupportedVariable = (typeof SUPPORTED_VARIABLES)[number];

export interface VariablePickerProps {
  /** Duoc goi khi user click mot bien. Gia tri tra ve la chuoi {{Var_Name}}. */
  onInsert: (variable: string) => void;
  label?: string;
}

/**
 * UC-10: Thanh chip cho phep HR Admin click chen bien dong vao dung vi tri
 * con tro cua textarea subject / body.
 */
export function VariablePicker({ onInsert, label = 'Chen bien dong:' }: VariablePickerProps) {
  return (
    <div className="flex flex-wrap items-start gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 max-h-32 overflow-y-auto">
      <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 shrink-0 mr-1 pt-0.5">
        <Code className="size-3.5" />
        {label}
      </span>
      {SUPPORTED_VARIABLES.map((varName) => (
        <button
          key={varName}
          type="button"
          onClick={() => onInsert(`{{${varName}}}`)}
          className="rounded bg-primary-100 px-2 py-0.5 font-mono text-xs text-primary-700 transition hover:bg-primary-200 hover:text-primary-800 active:scale-95 shrink-0"
        >
          {`{{${varName}}}`}
        </button>
      ))}
    </div>
  );
}

