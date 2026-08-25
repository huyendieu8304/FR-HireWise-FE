import { useId, useRef, useState, type DragEvent } from 'react';
import { CloudArrowUp, FilePdf, X } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';
import { CV_ALLOWED_EXTENSIONS, CV_MAX_SIZE_BYTES } from '../schema';

export interface CvDropzoneProps {
  value: File | null | undefined;
  onChange: (file: File | null) => void;
  error?: string;
  /** 0-100 khi đang upload (UC-17 "Other Information": hiện thanh tiến trình). `undefined` = chưa upload. */
  uploadProgress?: number;
  disabled?: boolean;
}

const ACCEPT_ATTR = '.pdf,.doc,.docx';

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Khung kéo-thả CV (UC-17 REF bảng field #4): kéo-thả hoặc bấm để chọn file,
 * hiện tên/dung lượng file đã chọn, và thanh tiến trình trong lúc upload.
 */
export function CvDropzone({
  value,
  onChange,
  error,
  uploadProgress,
  disabled,
}: CvDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onChange(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        CV của bạn
        <span className="text-danger-500 ml-0.5">*</span>
      </label>

      {value ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-0 p-4">
          <div className="flex items-center gap-3">
            <FilePdf className="text-danger-500 size-8 shrink-0" weight="fill" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{value.name}</p>
              <p className="text-xs text-neutral-500">
                {isUploading ? `Đang tải lên... ${uploadProgress}%` : formatFileSize(value.size)}
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                aria-label="Xóa file CV"
                onClick={() => {
                  onChange(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {uploadProgress !== undefined && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="bg-primary-600 h-full rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(event) => {
            if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-helper`}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors',
            isDragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-neutral-50',
            disabled && 'cursor-not-allowed opacity-60',
            error && 'border-danger-400',
          )}
        >
          <CloudArrowUp className="size-8 text-neutral-400" />
          <p className="text-sm text-neutral-600">
            Kéo-thả file vào đây, hoặc <span className="text-primary-600 font-medium">chọn file</span>
          </p>
          <p id={`${inputId}-helper`} className="text-xs text-neutral-400">
            .pdf, .doc, .docx — tối đa 10MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-danger-600 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

// Re-exported for consumers that only need the limits (avoids duplicating the constants).
export { CV_ALLOWED_EXTENSIONS, CV_MAX_SIZE_BYTES };
