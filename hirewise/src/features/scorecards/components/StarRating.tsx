import { Star } from '@phosphor-icons/react';
import { cn } from '@/utils/cn';

export interface StarRatingProps {
  /** Điểm tối đa của tiêu chí — số sao hiển thị = `Math.round(maxScore)` (mỗi sao = 1 điểm). */
  maxScore: number;
  /** `null` = chưa chấm điểm — không sao nào tô. */
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * "Interactive Star Rating" theo UC-28 Screen Description — component tự
 * viết bằng icon Phosphor có sẵn (`Star`), không thêm thư viện star-rating
 * ngoài (CLAUDE.md: không tự ý thêm dependency mới).
 */
export function StarRating({ maxScore, value, onChange, disabled }: StarRatingProps) {
  const starCount = Math.max(1, Math.round(maxScore));
  const stars = Array.from({ length: starCount }, (_, index) => index + 1);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={`Chấm điểm trên thang ${starCount} sao`}>
      {stars.map((star) => {
        const filled = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={filled}
            aria-label={`${star} sao`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={cn(
              'rounded-md p-0.5 transition-colors disabled:cursor-not-allowed',
              filled ? 'text-warning-500' : 'text-neutral-300 hover:text-warning-300',
            )}
          >
            <Star className="size-5" weight={filled ? 'fill' : 'regular'} />
          </button>
        );
      })}
      <span className="ml-1.5 text-xs text-neutral-500">
        {value !== null ? `${value}/${starCount}` : `—/${starCount}`}
      </span>
    </div>
  );
}
