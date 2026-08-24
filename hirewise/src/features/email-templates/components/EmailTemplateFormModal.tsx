import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { AppError } from '@/types/api';
import {
  createEmailTemplate,
  listPipelineStagesForDropdown,
} from '../api/emailTemplatesApi';
import { emailTemplateSchema, type EmailTemplateFormValues } from '../schema';

export interface EmailTemplateFormModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * UC-09 normal flow (tao moi template).
 */
export function EmailTemplateFormModal({ open, onClose }: EmailTemplateFormModalProps) {
  const notify = useNotification();
  const queryClient = useQueryClient();

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
    formState: { errors },
  } = useForm<EmailTemplateFormValues>({ resolver: zodResolver(emailTemplateSchema) });

  useEffect(() => {
    if (open) {
      reset({ name: '', code: '', pipelineStageId: '', subjectTemplate: '', bodyTemplate: '' });
    }
  }, [open, reset]);

  function buildPayload(values: EmailTemplateFormValues) {
    return {
      name: values.name,
      code: values.code,
      pipelineStageId: values.pipelineStageId ? Number(values.pipelineStageId) : null,
      subjectTemplate: values.subjectTemplate,
      bodyTemplate: values.bodyTemplate,
    };
  }

  const mutation = useMutation({
    mutationFn: (values: EmailTemplateFormValues) =>
      createEmailTemplate(buildPayload(values)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      notify.success(`Da tao template "${saved.name}" thanh cong.`);
      handleClose();
    },
    onError: (error) => {
      // 409 Conflict = EMAIL_TEMPLATE_CODE_DUPLICATE (BR-EMAILTPL-01)
      if (error instanceof AppError && error.status === 409) {
        setError('code', { message: error.message });
      }
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  const stageOptions = stages.map((s) => ({
    value: String(s.id),
    label: s.pipelineTemplateName ? `${s.pipelineTemplateName} — ${s.name}` : s.name,
  }));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tao Template moi"
      description="Tao moi mot email template de su dung trong quy trinh tuyen dung."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Huy
          </Button>
          <Button
            type="submit"
            form="email-template-form"
            isLoading={mutation.isPending}
          >
            Tao Template
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
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Ten Template"
            placeholder="Vi du: Thu moi phong van"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <TextInput
            label="Ma (Code)"
            placeholder="Vi du: EM-01"
            required
            error={errors.code?.message}
            {...register('code')}
          />
        </div>

        <Select
          label="Gan vao Stage (tuy chon)"
          placeholder="Khong gan stage nao"
          options={stageOptions}
          error={errors.pipelineStageId?.message}
          {...register('pipelineStageId')}
        />

        <TextInput
          label="Tieu de Email (Subject)"
          placeholder="Vi du: [HireWise] Thu moi phong van vi tri {{Job_Title}}"
          required
          error={errors.subjectTemplate?.message}
          {...register('subjectTemplate')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">
            Noi dung Email (Body)
            <span className="ml-1 text-danger-500">*</span>
          </label>
          <textarea
            className="min-h-[180px] w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            placeholder={'Xin chao {{Candidate_Name}},\n\nNoi dung email...'}
            {...register('bodyTemplate')}
          />
          {errors.bodyTemplate && (
            <p className="text-sm text-danger-600">{errors.bodyTemplate.message}</p>
          )}
          <p className="text-xs text-neutral-400">
            Su dung bien dong nhu <code className="bg-neutral-100 px-1">{"{{Candidate_Name}}"}</code>,{' '}
            <code className="bg-neutral-100 px-1">{"{{Job_Title}}"}</code>, v.v.
          </p>
        </div>
      </form>
    </Modal>
  );
}