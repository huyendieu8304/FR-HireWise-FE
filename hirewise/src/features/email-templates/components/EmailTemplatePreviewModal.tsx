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
  Candidate_Name: 'Nguyen Van A',
  Full_Name: 'Nguyen Van A',
  Job_Title: 'Backend Developer',
  Company: 'HireWise Corp',
  Department_Name: 'Engineering',
  Openings: '2',
  Role_Name: 'Recruiter',
  Recruiter_Name: 'Tran Thi B',
  Manager_Name: 'Le Van C',
  Interviewer_Name: 'Pham Thi D',
  Interview_Date: '10/09/2026',
  Interview_Time: '09:00 SA',
  Interview_Mode: 'Truc tuyen (Google Meet)',
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
  Decision: 'phe duyet',
  Applied_At: '05/09/2026 10:15',
  Reject_Reason_Block: '',
  Custom_Message_Block: '',
  Channel_Status_List: '- LinkedIn: Thanh cong\n- VietnamWorks: Dang xu ly',
  Breach_List: '- Nguyen Van X (3 ngay)\n- Tran Thi Y (2 ngay)',
  n: '3',
  Stage_Name: 'Phong van vong 1',
};

// ============================================================
// Helpers
// ============================================================

const PLACEHOLDER_RE = /\{\{([^}]+)}}/g;

function renderSegments(
  template: string,
  data: DummyData,
): Array<{ text: string; isError: boolean }> {
  const parts: Array<{ text: string; isError: boolean }> = [];
  let lastIndex = 0;

  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const [full, varName] = match;
    const trimmed = varName.trim() as SupportedVariable;
    const start = match.index!;

    if (start > lastIndex) {
      parts.push({ text: template.slice(lastIndex, start), isError: false });
    }

    const known = (SUPPORTED_VARIABLES as readonly string[]).includes(trimmed);
    parts.push({
      text: known ? data[trimmed] || `{{${trimmed}}}` : full,
      isError: !known,
    });

    lastIndex = start + full.length;
  }

  if (lastIndex < template.length) {
    parts.push({ text: template.slice(lastIndex), isError: false });
  }

  return parts;
}

// ============================================================
// Sub-component: rendered text with error highlight
// ============================================================

function Rendered({ segs }: { segs: Array<{ text: string; isError: boolean }> }) {
  return (
    <>
      {segs.map((seg, i) =>
        seg.isError ? (
          <mark
            key={i}
            className="rounded bg-danger-100 px-0.5 text-danger-700 font-mono text-sm not-italic"
            title="Bien khong hop le (BR-EMAILTPL-02)"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

// ============================================================
// Props & main component
// ============================================================

export interface EmailTemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  subjectTemplate: string;
  bodyTemplate: string;
}

/**
 * UC-11: Preview modal hien thi email da render voi dummy data.
 * Buoc 1 - nhap dummy data (chi hien thi bien co trong template).
 * Buoc 2 - xem email render (giong giao dien email client).
 */
export function EmailTemplatePreviewModal({
  open,
  onClose,
  subjectTemplate,
  bodyTemplate,
}: EmailTemplatePreviewModalProps) {
  const [dummyData, setDummyData] = useState<DummyData>(INITIAL_DUMMY_DATA);
  const [step, setStep] = useState<'data' | 'preview'>('preview');

  function handleClose() {
    setStep('preview');
    onClose();
  }

  // Chi hien thi bien co trong template (giam nhieu)
  const usedVars = [
    ...new Set([
      ...[...subjectTemplate.matchAll(PLACEHOLDER_RE)].map((m) => m[1].trim()),
      ...[...bodyTemplate.matchAll(PLACEHOLDER_RE)].map((m) => m[1].trim()),
    ]),
  ].filter((v) => (SUPPORTED_VARIABLES as readonly string[]).includes(v)) as SupportedVariable[];

  const subjectSegs = renderSegments(subjectTemplate, dummyData);
  const bodySegs = renderSegments(bodyTemplate, dummyData);
  const hasErrors =
    subjectSegs.some((s) => s.isError) || bodySegs.some((s) => s.isError);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Preview Email"
      size="lg"
      footer={
        step === 'preview' ? (
          <>
            <Button variant="outline" onClick={() => setStep('data')}>
              Chinh du lieu mau
            </Button>
            <Button onClick={handleClose}>Dong</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>Dong</Button>
            <Button onClick={() => setStep('preview')}>
              <Eye className="size-4" />
              Xem truoc
            </Button>
          </>
        )
      }
    >
      {step === 'data' ? (
        /* ── Buoc 1: nhap du lieu mau - chi bien co trong template ── */
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500">
            Dieu chinh du lieu mau de xem preview thay doi.
            Chi hien bien dang su dung trong template nay.
          </p>
          {usedVars.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Template chua co bien dong nao.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {usedVars.map((v) => (
                <TextInput
                  key={v}
                  label={v.replace(/_/g, ' ')}
                  value={dummyData[v]}
                  onChange={(e) => setDummyData((prev) => ({ ...prev, [v]: e.target.value }))}
                  placeholder={`Gia tri cho {{${v}}}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Buoc 2: email client mock ── */
        <div className="flex flex-col gap-3">
          {hasErrors && (
            <div className="flex items-center gap-2 rounded-md bg-danger-50 border border-danger-200 px-3 py-2">
              <span className="text-danger-600 text-xs font-medium">
                Bien khong hop le duoc highlight do bên duoi (BR-EMAILTPL-02 / EX-01).
              </span>
            </div>
          )}

          {/* Email card */}
          <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
            {/* Email client top bar */}
            <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-[#ff5f57]" />
                <div className="size-3 rounded-full bg-[#febc2e]" />
                <div className="size-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="mx-auto text-xs text-neutral-400 font-medium">Mail Preview</span>
            </div>

            {/* Email header */}
            <div className="bg-white px-5 pt-4 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 shrink-0">
                  <EnvelopeSimple className="size-4" weight="fill" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">HireWise System</p>
                  <p className="text-xs text-neutral-400">no-reply@hirewise.com</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-neutral-400 w-14 shrink-0">Tieu de:</span>
                <p className="text-sm font-semibold text-neutral-900 leading-snug">
                  <Rendered segs={subjectSegs} />
                </p>
              </div>
            </div>

            {/* Email body */}
            <div className="bg-white px-5 py-5 max-h-72 overflow-y-auto">
              <div className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                <Rendered segs={bodySegs} />
              </div>
            </div>

            {/* Footer bar */}
            <div className="bg-neutral-50 border-t border-neutral-100 px-5 py-2.5">
              <p className="text-[11px] text-neutral-400">
                Day la ban xem truoc email — du lieu mau, khong phai email that.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('data')}
            className="flex items-center gap-1 text-xs text-primary-600 hover:underline self-start"
          >
            <ArrowLeft className="size-3" />
            Chinh du lieu mau
          </button>
        </div>
      )}
    </Modal>
  );
}