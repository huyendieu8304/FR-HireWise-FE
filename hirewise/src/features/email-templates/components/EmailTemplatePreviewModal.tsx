import { useState } from 'react';
import { Eye, ArrowLeft, EnvelopeSimple } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { SUPPORTED_VARIABLES, type SupportedVariable } from './VariablePicker';

// ============================================================
// Types & constants
// ============================================================

type DummyData = Record<SupportedVariable, string>;

const INITIAL_DUMMY_DATA: DummyData = {
  Candidate_Name: 'Nguyễn Văn A',
  Full_Name: 'Nguyễn Văn A',
  Job_Title: 'Senior Backend Engineer',
  Company: 'HireWise Corp',
  Department_Name: 'Engineering',
  Openings: '2',
  Role_Name: 'Recruiter',
  Recruiter_Name: 'Trần Thị B',
  Manager_Name: 'Lê Văn C',
  Interviewer_Name: 'Phạm Thị D',
  Interview_Date: '10/09/2026',
  Interview_Time: '09:00 SA',
  Interview_Mode: 'Trực tuyến (Google Meet)',
  Meeting_Location_Or_Link: 'https://meet.google.com/abc-defg-hij',
  Confirm_Link: 'https://hirewise.example.com/confirm/789',
  Booking_Link: 'https://hirewise.example.com/book/456',
  Expiry_Hours: '48',
  Scorecard_Link: 'https://hirewise.example.com/scorecard/101',
  Candidate_Profile_Link: 'https://hirewise.example.com/candidate/202',
  Offer_Link: 'https://hirewise.example.com/offer/123',
  Expiry_Date: '15/09/2026',
  Signed_At: '12/09/2026 14:30',
  Signed_File_Link: 'https://hirewise.example.com/contract/303',
  Start_Date: '01/10/2026',
  Activation_Link: 'https://hirewise.example.com/activate?token=abc123',
  Job_Approval_Link: 'https://hirewise.example.com/jobs/404/approve',
  Job_Link: 'https://hirewise.example.com/jobs/404',
  Dashboard_Link: 'https://hirewise.example.com/dashboard',
  Decision: 'phê duyệt',
  Applied_At: '05/09/2026 10:15',
  Reject_Reason_Block: '',
  Custom_Message_Block: '',
  Channel_Status_List: '- LinkedIn: Thành công<br/>- VietnamWorks: Đang xử lý',
  Breach_List: '- Nguyễn Văn X (3 ngày)<br/>- Trần Thị Y (2 ngày)',
  n: '3',
  Stage_Name: 'Phỏng vấn vòng 1',
};

const PLACEHOLDER_RE = /\{\{([^}]+)}}/g;

/**
 * Merge nội dung HTML/Text với dummy data:
 * - Biến hợp lệ -> thay thế bằng dữ liệu mẫu
 * - Biến không hợp lệ -> highlight đỏ theo BR-EMAILTPL-02 / EX-01
 */
function renderHtmlContent(template: string, data: DummyData): { html: string; hasError: boolean } {
  let hasError = false;
  if (!template) return { html: '', hasError: false };

  const rendered = template.replace(PLACEHOLDER_RE, (fullMatch, rawVarName) => {
    const varName = rawVarName.trim() as SupportedVariable;
    const isKnown = (SUPPORTED_VARIABLES as readonly string[]).includes(varName);

    if (isKnown) {
      return data[varName] !== undefined ? data[varName] : fullMatch;
    } else {
      hasError = true;
      return `<mark style="background-color: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: 600;" title="Biến không hợp lệ (BR-EMAILTPL-02)">${fullMatch}</mark>`;
    }
  });

  return { html: rendered, hasError };
}

export interface EmailTemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  subjectTemplate: string;
  bodyTemplate: string;
}

export function EmailTemplatePreviewModal({
  open,
  onClose,
  subjectTemplate,
  bodyTemplate,
}: EmailTemplatePreviewModalProps) {
  const [dummyData, setDummyData] = useState<DummyData>(INITIAL_DUMMY_DATA);
  const [step, setStep] = useState<'preview' | 'data'>('preview');

  function handleClose() {
    setStep('preview');
    onClose();
  }

  // Lấy các biến đang được sử dụng trong template
  const usedVars = [
    ...new Set([
      ...[...subjectTemplate.matchAll(PLACEHOLDER_RE)].map((m) => m[1].trim()),
      ...[...bodyTemplate.matchAll(PLACEHOLDER_RE)].map((m) => m[1].trim()),
    ]),
  ].filter((v) => (SUPPORTED_VARIABLES as readonly string[]).includes(v)) as SupportedVariable[];

  const subjectRender = renderHtmlContent(subjectTemplate, dummyData);
  const bodyRender = renderHtmlContent(bodyTemplate, dummyData);
  const hasErrors = subjectRender.hasError || bodyRender.hasError;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Xem trước Email (HTML Preview)"
      size="lg"
      footer={
        step === 'preview' ? (
          <>
            <Button variant="outline" onClick={() => setStep('data')}>
              Chỉnh dữ liệu mẫu ({usedVars.length} biến)
            </Button>
            <Button onClick={handleClose}>Đóng</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button onClick={() => setStep('preview')}>
              <Eye className="size-4" />
              Xem trước
            </Button>
          </>
        )
      }
    >
      {step === 'data' ? (
        /* Bước: Nhập dữ liệu mẫu */
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500">
            Điều chỉnh dữ liệu mẫu bên dưới để xem email hiển thị thực tế:
          </p>
          {usedVars.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Template hiện chưa chèn biến động nào.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {usedVars.map((v) => (
                <TextInput
                  key={v}
                  label={v.replace(/_/g, ' ')}
                  value={dummyData[v]}
                  onChange={(e) => setDummyData((prev) => ({ ...prev, [v]: e.target.value }))}
                  placeholder={`Giá trị cho {{${v}}}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Bước: Xem trước giao diện Email Client hoàn chỉnh */
        <div className="flex flex-col gap-3">
          {hasErrors && (
            <div className="flex items-center gap-2 rounded-md bg-danger-50 border border-danger-200 px-3 py-2">
              <span className="text-danger-700 text-xs font-medium">
                ⚠️ Phát hiện biến không thuộc danh sách hỗ trợ (được highlight đỏ bên dưới theo BR-EMAILTPL-02).
              </span>
            </div>
          )}

          {/* Email mockup window */}
          <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
            {/* Topbar email app */}
            <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-[#ff5f57]" />
                <div className="size-3 rounded-full bg-[#febc2e]" />
                <div className="size-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="mx-auto text-xs text-neutral-400 font-medium">HireWise Mail Client</span>
            </div>

            {/* Email Header */}
            <div className="bg-white px-5 pt-4 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 shrink-0">
                  <EnvelopeSimple className="size-4" weight="fill" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">HireWise Notification</p>
                  <p className="text-xs text-neutral-400">no-reply@hirewise.com</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-neutral-400 w-14 shrink-0">Tiêu đề:</span>
                <div
                  className="text-sm font-semibold text-neutral-900 leading-snug"
                  dangerouslySetInnerHTML={{ __html: subjectRender.html }}
                />
              </div>
            </div>

            {/* Email Body rendered as HTML */}
            <div className="bg-white px-6 py-5 max-h-80 overflow-y-auto">
              <div
                className="prose prose-sm max-w-none text-neutral-800 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: bodyRender.html }}
              />
            </div>

            {/* Footer mockup */}
            <div className="bg-neutral-50 border-t border-neutral-100 px-5 py-2.5">
              <p className="text-[11px] text-neutral-400">
                Đây là bản xem trước định dạng HTML thực tế sẽ được gửi tới hòm thư ứng viên / nhân sự.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('data')}
            className="flex items-center gap-1 text-xs text-primary-600 hover:underline self-start"
          >
            <ArrowLeft className="size-3" />
            Chỉnh sửa dữ liệu mẫu ({usedVars.length} biến)
          </button>
        </div>
      )}
    </Modal>
  );
}