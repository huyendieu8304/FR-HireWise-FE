import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  ListBullets,
  ListNumbers,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  Link as LinkIcon,
  Code as CodeIcon,
  Eraser,
  ArrowCounterClockwise,
  ArrowClockwise,
} from '@phosphor-icons/react';

export interface RichTextEditorRef {
  insertHtmlAtCursor: (html: string) => void;
  insertTextAtCursor: (text: string) => void;
  focus: () => void;
  getMode: () => 'visual' | 'code';
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  minHeight?: string;
}

/** Format mã HTML theo chiều dọc sạch sẽ, dễ đọc như cấu trúc email */
export function formatHtmlForEditor(html: string): string {
  if (!html) return '';
  return html
    // Chuẩn hóa ngắt dòng các thẻ block
    .replace(/<\/p>\s*<p>/gi, '</p>\n\n<p>')
    .replace(/<br\s*\/?>\s*/gi, '<br/>\n')
    .replace(/<\/div>\s*<div>/gi, '</div>\n<div>')
    .replace(/<\/h([1-6])>\s*/gi, '</h$1>\n\n')
    .replace(/<li[^>]*>/gi, '  <li>')
    .replace(/<\/li>\s*/gi, '</li>\n')
    .replace(/<ul[^>]*>/gi, '<ul>\n')
    .replace(/<\/ul>\s*/gi, '</ul>\n\n')
    .replace(/<ol[^>]*>/gi, '<ol>\n')
    .replace(/<\/ol>\s*/gi, '</ol>\n\n')
    .trim();
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = 'Nhập nội dung email...', onFocus, onBlur, error, minHeight = '240px' }, ref) => {
    const [mode, setMode] = useState<'visual' | 'code'>('visual');
    const visualEditorRef = useRef<HTMLDivElement | null>(null);
    const codeEditorRef = useRef<HTMLTextAreaElement | null>(null);
    const savedSelectionRangeRef = useRef<Range | null>(null);

    // Đồng bộ value vào visual contentEditable
    useEffect(() => {
      if (visualEditorRef.current && mode === 'visual') {
        const currentHtml = visualEditorRef.current.innerHTML;
        if (currentHtml !== value) {
          visualEditorRef.current.innerHTML = value || '';
        }
      }
    }, [value, mode]);

    // Lưu vị trí selection trong visual editor
    const saveSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && visualEditorRef.current?.contains(sel.anchorNode)) {
        savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };

    // Khôi phục selection
    const restoreSelection = () => {
      const sel = window.getSelection();
      if (sel && savedSelectionRangeRef.current) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRangeRef.current);
      }
    };

    // Thực thi lệnh định dạng execCommand
    const exec = (command: string, arg: string | undefined = undefined) => {
      if (mode !== 'visual') return;
      visualEditorRef.current?.focus();
      restoreSelection();
      document.execCommand(command, false, arg);
      saveSelection();
      handleVisualInput();
    };

    // Xử lý khi nội dung visual editor thay đổi
    const handleVisualInput = () => {
      if (!visualEditorRef.current) return;
      const html = visualEditorRef.current.innerHTML;
      const cleanHtml = html === '<p><br></p>' || html === '<br>' ? '' : html;
      onChange(cleanHtml);
    };

    // Xử lý chuyển đổi giữa Visual & Code View
    const toggleMode = () => {
      if (mode === 'visual') {
        // Chuyển sang Code View: Format HTML theo chiều dọc sạch sẽ
        const formatted = formatHtmlForEditor(value || visualEditorRef.current?.innerHTML || '');
        onChange(formatted);
        setMode('code');
        requestAnimationFrame(() => {
          if (codeEditorRef.current) {
            codeEditorRef.current.focus();
          }
        });
      } else {
        // Chuyển lại Visual Editor
        setMode('visual');
        requestAnimationFrame(() => {
          if (visualEditorRef.current) {
            visualEditorRef.current.innerHTML = value || '';
            visualEditorRef.current.focus();
          }
        });
      }
    };

    // Cho phép cha gọi chèn text/HTML tại con trỏ
    useImperativeHandle(ref, () => ({
      insertHtmlAtCursor(htmlToInsert: string) {
        if (mode === 'visual') {
          visualEditorRef.current?.focus();
          restoreSelection();
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0 && visualEditorRef.current?.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const el = document.createElement('div');
            el.innerHTML = htmlToInsert;
            const frag = document.createDocumentFragment();
            let node: ChildNode | null;
            let lastNode: ChildNode | null = null;
            while ((node = el.firstChild)) {
              lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            if (lastNode) {
              range.setStartAfter(lastNode);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            saveSelection();
            handleVisualInput();
          } else {
            const currentHtml = visualEditorRef.current?.innerHTML || '';
            const newHtml = currentHtml + htmlToInsert;
            if (visualEditorRef.current) visualEditorRef.current.innerHTML = newHtml;
            onChange(newHtml);
          }
        } else {
          // Code mode
          const el = codeEditorRef.current;
          if (!el) return;
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const newVal = el.value.slice(0, start) + htmlToInsert + el.value.slice(end);
          onChange(newVal);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + htmlToInsert.length, start + htmlToInsert.length);
          });
        }
      },
      insertTextAtCursor(text: string) {
        this.insertHtmlAtCursor(text);
      },
      focus() {
        if (mode === 'visual') {
          visualEditorRef.current?.focus();
        } else {
          codeEditorRef.current?.focus();
        }
      },
      getMode() {
        return mode;
      },
    }));

    const handlePromptLink = () => {
      const url = window.prompt('Nhập URL liên kết:', 'https://');
      if (url) {
        exec('createLink', url);
      }
    };

    return (
      <div className="flex flex-col rounded-md border border-neutral-300 bg-white overflow-hidden shadow-2xs focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition">
        {/* Toolbar chuẩn WYSIWYG */}
        <div className="flex flex-wrap items-center justify-between gap-1 border-b border-neutral-200 bg-neutral-100 px-2 py-1.5 text-neutral-700 select-none">
          <div className="flex flex-wrap items-center gap-0.5">
            {/* Lịch sử */}
            <button
              type="button"
              onClick={() => exec('undo')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-600"
              title="Hoàn tác (Undo)"
            >
              <ArrowCounterClockwise className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('redo')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-600"
              title="Làm lại (Redo)"
            >
              <ArrowClockwise className="size-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-neutral-300" />

            {/* Định dạng chữ */}
            <button
              type="button"
              onClick={() => exec('bold')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700 font-bold"
              title="In đậm (Ctrl+B)"
            >
              <TextB className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('italic')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700 italic"
              title="In nghiêng (Ctrl+I)"
            >
              <TextItalic className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('underline')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700 underline"
              title="Gạch chân (Ctrl+U)"
            >
              <TextUnderline className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('strikeThrough')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700 line-through"
              title="Gạch ngang"
            >
              <TextStrikethrough className="size-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-neutral-300" />

            {/* Heading / Block */}
            <select
              aria-label="Định dạng khối văn bản"
              disabled={mode === 'code'}
              onChange={(e) => {
                exec('formatBlock', e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="rounded border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-50 focus:outline-none disabled:opacity-40"
            >
              <option value="" disabled>Định dạng</option>
              <option value="<p>">Đoạn văn (Paragraph)</option>
              <option value="<h1>">Tiêu đề lớn (H1)</option>
              <option value="<h2>">Tiêu đề vừa (H2)</option>
              <option value="<h3>">Tiêu đề nhỏ (H3)</option>
              <option value="<blockquote>">Trích dẫn (Quote)</option>
            </select>

            <div className="mx-1 h-4 w-px bg-neutral-300" />

            {/* Danh sách */}
            <button
              type="button"
              onClick={() => exec('insertUnorderedList')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Danh sách dấu chấm"
            >
              <ListBullets className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertOrderedList')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Danh sách số"
            >
              <ListNumbers className="size-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-neutral-300" />

            {/* Căn lề */}
            <button
              type="button"
              onClick={() => exec('justifyLeft')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Căn trái"
            >
              <TextAlignLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyCenter')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Căn giữa"
            >
              <TextAlignCenter className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyRight')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Căn phải"
            >
              <TextAlignRight className="size-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-neutral-300" />

            {/* Link & Clear */}
            <button
              type="button"
              onClick={handlePromptLink}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Chèn liên kết (Link)"
            >
              <LinkIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('removeFormat')}
              disabled={mode === 'code'}
              className="rounded p-1.5 hover:bg-neutral-200 disabled:opacity-40 transition text-neutral-700"
              title="Xóa định dạng"
            >
              <Eraser className="size-4" />
            </button>
          </div>

          {/* Nút Switch chuẩn: chỉ 1 biểu tượng </> duy nhất */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleMode}
              className={`flex items-center justify-center rounded px-2.5 py-1 text-xs font-mono font-bold transition shadow-2xs ${
                mode === 'code'
                  ? 'bg-neutral-900 text-emerald-400 border border-neutral-700 hover:bg-neutral-800'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900'
              }`}
              title={mode === 'code' ? 'Chuyển sang soạn thảo trực quan (Visual Editor)' : 'Xem/Sửa mã nguồn HTML (</>)'}
            >
              {'</>'}
            </button>
          </div>
        </div>

        {/* Nội dung Editor */}
        <div className="relative flex-1 bg-white">
          {mode === 'visual' ? (
            /* Visual WYSIWYG ContentEditable */
            <div
              ref={visualEditorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Nội dung email WYSIWYG"
              className="prose prose-sm max-w-none p-4 text-neutral-900 focus:outline-none overflow-y-auto leading-relaxed"
              style={{ minHeight }}
              onInput={handleVisualInput}
              onFocus={() => {
                onFocus?.();
                saveSelection();
              }}
              onBlur={() => {
                onBlur?.();
                saveSelection();
              }}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              data-placeholder={placeholder}
            />
          ) : (
            /* HTML Source Code Editor (Dark Mode theo chiều dọc chuẩn email) */
            <div className="relative flex bg-[#1e1e1e] text-emerald-400 font-mono text-sm">
              <textarea
                ref={codeEditorRef}
                value={value}
                aria-label="Mã nguồn HTML email"
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                className="w-full resize-y bg-transparent p-4 text-emerald-300 placeholder-neutral-600 focus:outline-none font-mono leading-relaxed selection:bg-neutral-700 whitespace-pre"
                style={{ minHeight }}
                placeholder="<p>Nhập mã HTML tại đây...</p>"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-danger-200 bg-danger-50 px-3 py-1.5">
            <p className="text-xs text-danger-600 font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';