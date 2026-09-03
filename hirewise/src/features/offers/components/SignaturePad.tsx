import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import type { SignatureMethod } from '../publicTypes';

export interface SignaturePadProps {
  method: SignatureMethod;
  onMethodChange: (method: SignatureMethod) => void;
  /** Họ tên gõ tay khi ký kiểu TYPE. */
  typedName: string;
  onTypedNameChange: (value: string) => void;
  /** `data:image/png;base64,...` của nét vẽ, hoặc rỗng khi khung còn trống. */
  onDrawingChange: (dataUri: string) => void;
  disabled?: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const STROKE_WIDTH = 2.5;

/**
 * UC-39 Screen Description ô 1-2: khung ký chữ ký, chuyển đổi giữa 2 chế độ
 * Vẽ / Gõ tên (LV-22), có Clear và Undo trước khi xác nhận.
 *
 * Tự viết bằng `<canvas>` + pointer event thay vì thêm
 * `react-signature-canvas` — pointer event xử lý được cả chuột, cảm ứng và
 * bút stylus bằng một đường code, nên thư viện không mang lại thêm gì đáng
 * kể mà lại thêm một dependency phải bảo trì.
 */
export function SignaturePad({
  method,
  onMethodChange,
  typedName,
  onTypedNameChange,
  onDrawingChange,
  disabled,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  // Mỗi stroke là một mảng điểm; giữ nguyên lịch sử để Undo bỏ được từng nét.
  const strokesRef = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    redraw();
    // Đổi sang chế độ gõ tên thì nét vẽ cũ không còn là chữ ký sẽ gửi đi nữa.
    if (method === 'TYPE') {
      onDrawingChange('');
    } else if (hasDrawing) {
      onDrawingChange(canvasRef.current?.toDataURL('image/png') ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  function context() {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineWidth = STROKE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111827';
    }
    return ctx;
  }

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = context();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const point of stroke.slice(1)) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }

  /** Quy đổi toạ độ con trỏ sang hệ toạ độ nội bộ của canvas (canvas bị co theo CSS). */
  function pointFrom(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    // Giữ pointer để nét vẽ không đứt khi con trỏ đi ra ngoài khung.
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    strokesRef.current.push([pointFrom(event)]);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    strokesRef.current[strokesRef.current.length - 1].push(pointFrom(event));
    redraw();
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    commit();
  }

  function commit() {
    const drawn = strokesRef.current.some((stroke) => stroke.length > 1);
    setHasDrawing(drawn);
    // Khung trống vẫn serialize ra PNG hợp lệ, nên gửi chuỗi rỗng để backend
    // báo đúng ME-34 thay vì nhận một ảnh trắng.
    onDrawingChange(drawn ? (canvasRef.current?.toDataURL('image/png') ?? '') : '');
  }

  function handleUndo() {
    strokesRef.current.pop();
    redraw();
    commit();
  }

  function handleClear() {
    strokesRef.current = [];
    redraw();
    commit();
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap items-center gap-4" disabled={disabled}>
        <legend className="sr-only">Hình thức ký</legend>
        {(
          [
            ['DRAW', 'Vẽ chữ ký'],
            ['TYPE', 'Gõ họ tên'],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
            <input
              type="radio"
              name="signature-method"
              value={value}
              checked={method === value}
              onChange={() => onMethodChange(value)}
              className="size-4 accent-primary-600"
            />
            {label}
          </label>
        ))}
      </fieldset>

      {method === 'DRAW' ? (
        <div className="flex flex-col gap-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Khung vẽ chữ ký"
            // touch-none: nếu không tắt, thao tác vẽ trên mobile bị trình
            // duyệt hiểu thành cuộn trang và nét vẽ đứt quãng.
            className="h-40 w-full touch-none rounded-md border border-dashed border-neutral-300 bg-white"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Dùng chuột hoặc ngón tay để ký vào khung trên.
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={disabled || !hasDrawing}
              >
                <ArrowCounterClockwise className="size-4" />
                Hoàn tác
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={disabled || !hasDrawing}
              >
                <Trash className="size-4" />
                Xóa
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <TextInput
          label="Họ tên dùng làm chữ ký"
          required
          disabled={disabled}
          placeholder="Nguyễn Văn A"
          helperText="Họ tên bạn gõ ở đây sẽ được dùng làm chữ ký nháy trên hợp đồng."
          value={typedName}
          onChange={(e) => onTypedNameChange(e.target.value)}
        />
      )}
    </div>
  );
}
