import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { RichTextEditor, formatHtmlForEditor, type RichTextEditorRef } from './RichTextEditor';

export interface EmailTemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: EmailTemplate;
}

type FocusedField = 'subject' | 'body';

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

/** Định dạng nội dung HTML cho Editor */
function cleanAndFormatHtml(text: string): string {
  if (!text) return '';
  const str = text.trim();

  if (/<[a-z][\s\S]*>/i.test(str)) {
    return formatHtmlForEditor(str);
  }

  // Nếu hoàn toàn là text thuần, bọc thành các đoạn <p>
  return str
    .split(/\r?\n\r?\n/)
    .map((p) => `<p>${p.replace(/\r?\n/g, '<br/>\n')}</p>`)
    .join('\n\n');
}

export function EmailTemplateFormModal({ open, onClose, initialValues }: EmailTemplateFormModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();
  const isEditing = !!initialValues;

  const [previewData, setPreviewData] = useState<{ subject: string; body: string } | null>(null);
  const [lastActiveField, setLastActiveField] = useState<FocusedField>('body');

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const richTextRef = useRef<RichTextEditorRef | null>(null);
  const subjectCursorPosRef = useRef<number>(0);

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
    getValues,
    setValue,
    control,
    formState: { errors },
  } = useForm<EmailTemplateFormValues>({ resolver: zodResolver(emailTemplateSchema) });

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      const formattedBody = cleanAndFormatHtml(initialValues.bodyTemplate);
      reset({
        name: initialValues.name,
        code: initialValues.code,
        pipelineStageId: initialValues.pipelineStageId ? String(initialValues.pipelineStageId) : '',
        subjectTemplate: initialValues.subjectTemplate,
        bodyTemplate: formattedBody,
      });
    } else {
      reset({
        name: '',
        code: '',
        pipelineStageId: '',
        subjectTemplate: '',
        bodyTemplate: '<p>Xin chào {{Candidate_Name}},</p>\n\n<p>Nội dung email...</p>\n\n<p>Trân trọng,<br/>\n{{Company}}</p>',
      });
    }
  }, [open, initialValues, reset]);

  /** Chèn biến động vào vị trí con trỏ của Subject hoặc RichTextEditor Body */
  function insertVariable(varName: string) {
    const varTag = `{{${varName}}}`;
    if (lastActiveField === 'subject') {
      const el = subjectRef.current;
      const currentVal = getValues('subjectTemplate') || '';
      let pos = subjectCursorPosRef.current;
      if (pos < 0 || pos > currentVal.length) pos = currentVal.length;

      const newVal = currentVal.slice(0, pos) + varTag + currentVal.slice(pos);
      setValue('subjectTemplate', newVal, { shouldValidate: true, shouldDirty: true });

      const newPos = pos + varTag.length;
      subjectCursorPosRef.current = newPos;

      requestAnimationFrame(() => {
        if (el) {
          el.focus();
          el.setSelectionRange(newPos, newPos);
        }
      });
    } else {
      richTextRef.current?.insertTextAtCursor(varTag);
    }
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
    setPreviewData(null);
    onClose();
  }

  const stageOptions = stages.map((s) => ({
    value: String(s.id),
    label: s.pipelineTemplateName ? `${s.pipelineTemplateName} — ${s.name}` : s.name,
  }));

  const { ref: subjectRHFRef, ...subjectRest } = register('subjectTemplate');

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={isEditing ? `Email Template: ${initialValues?.code}` : 'Tạo Email Template mới'}
        description={
          isEditing
            ? `Version hiện tại: v${initialValues?.version} — thay đổi nội dung sẽ tăng version tự động.`
            : 'Tạo mẫu email HTML tự động cho quy trình tuyển dụng.'
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
              onClick={() => {
                const values = getValues();
                setPreviewData({
                  subject: values.subjectTemplate || '',
                  body: values.bodyTemplate || '',
                });
              }}
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
                onFocus={() => {
                  setLastActiveField('subject');
                }}
                onSelect={(e) => {
                  subjectCursorPosRef.current = e.currentTarget.selectionStart ?? 0;
                }}
                onKeyUp={(e) => {
                  subjectCursorPosRef.current = e.currentTarget.selectionStart ?? 0;
                }}
                onClick={(e) => {
                  subjectCursorPosRef.current = e.currentTarget.selectionStart ?? 0;
                }}
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

          {/* Row 3: Message Body (Rich Text & HTML Switcher) */}
          <div className="flex flex-col gap-2">
            {/* Toolbar chèn biến động */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border border-b-0 border-neutral-300 bg-neutral-50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                <Code className="size-3.5 text-primary-600" />
                <span>Chèn biến ({lastActiveField === 'subject' ? 'Subject' : 'Body'}):</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
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

                <select
                  aria-label="Chọn biến động khác"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      insertVariable(e.target.value);
                      e.target.value = '';
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

            {/* Rich Text Editor với HTML Source Code Switch */}
            <Controller
              name="bodyTemplate"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  ref={richTextRef}
                  value={field.value}
                  onChange={field.onChange}
                  onFocus={() => setLastActiveField('body')}
                  error={errors.bodyTemplate?.message}
                  minHeight="220px"
                />
              )}
            />
            <p className="text-xs text-neutral-400">
              💡 Soạn thảo dạng trực quan (WYSIWYG) hoặc bấm nút <code className="bg-neutral-100 px-1.5 py-0.5 font-mono font-semibold text-neutral-800 rounded border border-neutral-300">&lt;/&gt;</code> để xem và chỉnh sửa mã HTML trực tiếp theo chiều dọc.
            </p>
          </div>
        </form>
      </Modal>

      <EmailTemplatePreviewModal
        open={!!previewData}
        onClose={() => setPreviewData(null)}
        subjectTemplate={previewData?.subject ?? ''}
        bodyTemplate={previewData?.body ?? ''}
      />
    </>
  );
}