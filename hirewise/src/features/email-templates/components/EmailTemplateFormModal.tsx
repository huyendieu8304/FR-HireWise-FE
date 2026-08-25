import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Code } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { AppError } from '@/types/api';
import {
  createEmailTemplate,
  listPipelineStagesForDropdown,
  updateEmailTemplate,
} from '../api/emailTemplatesApi';
import { emailTemplateSchema, type EmailTemplateFormValues } from '../schema';
import type { EmailTemplate } from '../types';
import { SUPPORTED_VARIABLES } from './VariablePicker';
import { EmailTemplatePreviewModal } from './EmailTemplatePreviewModal';

export interface EmailTemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: EmailTemplate;
}

type FocusedField = 'subject' | 'body';

// Top các biến hay dùng nhất để hiển thị nhanh dạng chip
const QUICK_VARIABLES = [
  'Candidate_Name',
  'Job_Title',
  'Company',
  'Interview_Date',
  'Interview_Time',
  'Booking_Link',
  'Offer_Link',
  'Recruiter_Name',
];

export function EmailTemplateFormModal({ open, onClose, initialValues }: EmailTemplateFormModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const isEditing = !!initialValues;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastActiveField, setLastActiveField] = useState<FocusedField>('body');

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorPositionRef = useRef<{ field: FocusedField; start: number; end: number }>({
    field: 'body',
    start: 0,
    end: 0,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['email-templates-pipeline-stages'],
    queryFn: listPipelineStagesForDropdown,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailTemplateFormValues>({ resolver: zodResolver(emailTemplateSchema) });

  const watchedSubject = watch('subjectTemplate') ?? '';
  const watchedBody = watch('bodyTemplate') ?? '';

  useEffect(() => {
    if (open && initialValues) {
      reset({
        name: initialValues.name,
        code: initialValues.code,
        pipelineStageId: initialValues.pipelineStageId ? String(initialValues.pipelineStageId) : '',
        subjectTemplate: initialValues.subjectTemplate,
        bodyTemplate: initialValues.bodyTemplate,
      });
      cursorPositionRef.current = {
        field: 'body',
        start: initialValues.bodyTemplate.length,
        end: initialValues.bodyTemplate.length,
      };
    } else if (open && !initialValues) {
      reset({ name: '', code: '', pipelineStageId: '', subjectTemplate: '', bodyTemplate: '' });
      cursorPositionRef.current = { field: 'body', start: 0, end: 0 };
    }
  }, [open, initialValues, reset]);

  /** Lưu vị trí con trỏ liên tục */
  function trackCursor(field: FocusedField) {
    setLastActiveField(field);
    const el = field === 'subject' ? subjectRef.current : bodyRef.current;
    if (!el) return;
    cursorPositionRef.current = {
      field,
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    };
  }

  /** Chèn biến động vào vị trí con trỏ */
  function insertVariable(varName: string) {
    const varTag = `{{${varName}}}`;
    const targetField = cursorPositionRef.current.field || lastActiveField;
    const isSubject = targetField === 'subject';
    const formFieldName = isSubject ? 'subjectTemplate' : 'bodyTemplate';
    const currentVal = isSubject ? watchedSubject : watchedBody;
    const el = isSubject ? subjectRef.current : bodyRef.current;

    let { start, end } = cursorPositionRef.current;
    if (start < 0 || start > currentVal.length) start = currentVal.length;
    if (end < 0 || end > currentVal.length) end = currentVal.length;

    const newVal = currentVal.slice(0, start) + varTag + currentVal.slice(end);
    setValue(formFieldName, newVal, { shouldValidate: true, shouldDirty: true });

    const newPos = start + varTag.length;
    cursorPositionRef.current = { field: targetField, start: newPos, end: newPos };

    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    });
  }

  const mutation = useMutation({
    mutationFn: (values: EmailTemplateFormValues) =>
      isEditing
        ? updateEmailTemplate(initialValues!.id, {
            name: values.name,
            code: values.code,
            pipelineStageId: values.pipelineStageId ? Number(values.pipelineStageId) : null,
            subjectTemplate: values.subjectTemplate,
            bodyTemplate: values.bodyTemplate,
          })
        : createEmailTemplate({
            name: values.name,
            code: values.code,
            pipelineStageId: values.pipelineStageId ? Number(values.pipelineStageId) : null,
            subjectTemplate: values.subjectTemplate,
            bodyTemplate: values.bodyTemplate,
          }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      notify.success(
        isEditing
          ? `Đã cập nhật template "${saved.name}" (v${saved.version}).`
          : `Đã tạo template "${saved.name}" thành công.`,
      );
      handleClose();
    },
    onError: (error) => {
      if (error instanceof AppError && error.status === 409) {
        setError('code', { message: error.message });
      }
    },
  });

  function handleClose() {
    reset();
    setIsPreviewOpen(false);
    onClose();
  }

  const stageOptions = stages.map((s) => ({
    value: String(s.id),
    label: s.pipelineTemplateName ? `${s.pipelineTemplateName} — ${s.name}` : s.name,
  }));

  const { ref: subjectRHFRef, ...subjectRest } = register('subjectTemplate');
  const { ref: bodyRHFRef, ...bodyRest } = register('bodyTemplate');

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={isEditing ? `Email Template: ${initialValues?.code}` : 'Tạo Email Template mới'}
        description={
          isEditing
            ? `Version hiện tại: v${initialValues?.version} — thay đổi nội dung sẽ tăng version tự động.`
            : 'Tạo mẫu email tự động cho quy trình tuyển dụng.'
        }
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              disabled={!watchedSubject && !watchedBody}
            >
              <Eye className="size-4" />
              Preview Email
            </Button>
            <Button type="submit" form="email-template-form" isLoading={mutation.isPending}>
              {isEditing ? 'Lưu thay đổi' : 'Tạo Template'}
            </Button>
          </>
        }
      >
        <form
          id="email-template-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          {/* Row 1: Tên + Code */}
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Template Name"
              placeholder="Ví dụ: Thư mời phỏng vấn"
              required
              error={errors.name?.message}
              {...register('name')}
            />
            <TextInput
              label="Mã (Code)"
              placeholder="Ví dụ: EM-14"
              required
              error={errors.code?.message}
              disabled={isEditing}
              {...register('code')}
            />
          </div>

          {/* Row 2: Stage + Subject */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gắn Stage (tùy chọn)"
              placeholder="Không gắn stage nào"
              options={stageOptions}
              error={errors.pipelineStageId?.message}
              {...register('pipelineStageId')}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subjectTemplate" className="text-sm font-medium text-neutral-700">
                Subject Line <span className="text-danger-500">*</span>
              </label>
              <input
                id="subjectTemplate"
                type="text"
                placeholder="[{{Company}}] Thư mời phỏng vấn vị trí {{Job_Title}}"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                onFocus={() => trackCursor('subject')}
                onClick={() => trackCursor('subject')}
                onKeyUp={() => trackCursor('subject')}
                onSelect={() => trackCursor('subject')}
                onBlur={() => trackCursor('subject')}
                ref={(el) => {
                  subjectRHFRef(el);
                  subjectRef.current = el;
                }}
                {...subjectRest}
              />
              {errors.subjectTemplate && (
                <p className="text-xs text-danger-600">{errors.subjectTemplate.message}</p>
              )}
            </div>
          </div>

          {/* Row 3: Message Body + Variable Toolbar */}
          <div className="flex flex-col gap-2">
            {/* Toolbar chèn biến */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border border-b-0 border-neutral-300 bg-neutral-50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                <Code className="size-3.5 text-primary-600" />
                <span>Chèn biến động ({lastActiveField === 'subject' ? 'Subject' : 'Body'}):</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Nút chip nhanh */}
                {QUICK_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="rounded bg-white border border-neutral-200 px-2 py-0.5 font-mono text-[11px] text-primary-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 transition active:scale-95 shadow-2xs"
                    title={`Chèn {{${v}}}`}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}

                {/* Dropdown danh sách tất cả các biến */}
                <select
                  aria-label="Chọn biến động khác"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      insertVariable(e.target.value);
                      e.target.value = ''; // Reset về placeholder
                    }
                  }}
                  className="rounded border border-primary-300 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800 hover:bg-primary-100 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="" disabled>
                    + Chọn biến khác ({SUPPORTED_VARIABLES.length - QUICK_VARIABLES.length})...
                  </option>
                  {SUPPORTED_VARIABLES.filter((v) => !QUICK_VARIABLES.includes(v)).map((v) => (
                    <option key={v} value={v}>
                      {`{{${v}}}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Textarea body */}
            <textarea
              id="bodyTemplate"
              className="min-h-[220px] w-full resize-y rounded-b-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 font-mono leading-relaxed transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
              placeholder={'Xin chào {{Candidate_Name}},\n\nNội dung email của bạn...'}
              onFocus={() => trackCursor('body')}
              onClick={() => trackCursor('body')}
              onKeyUp={() => trackCursor('body')}
              onSelect={() => trackCursor('body')}
              onBlur={() => trackCursor('body')}
              ref={(el) => {
                bodyRHFRef(el);
                bodyRef.current = el;
              }}
              {...bodyRest}
            />
            {errors.bodyTemplate && (
              <p className="text-xs text-danger-600">{errors.bodyTemplate.message}</p>
            )}
            <p className="text-xs text-neutral-400">
              💡 Bấm vào ô Subject hoặc Body, sau đó click biến trên thanh công cụ để chèn vào vị trí con trỏ.
            </p>
          </div>
        </form>
      </Modal>

      <EmailTemplatePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        subjectTemplate={watchedSubject}
        bodyTemplate={watchedBody}
      />
    </>
  );
}