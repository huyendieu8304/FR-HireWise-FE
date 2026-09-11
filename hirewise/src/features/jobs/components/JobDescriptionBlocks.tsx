export interface JobDescriptionBlocksProps {
  description: string | null;
  requirements: string | null;
  benefits: string | null;
}

/**
 * 3 khối JD dùng chung giữa `JobDetailPage` và `ApprovalDetailPage` — nội
 * dung do Recruiter soạn qua `RichTextEditor` (WYSIWYG) ở `JobFormPage`,
 * lưu dạng HTML, chứ không phải text thường. Render bằng
 * `dangerouslySetInnerHTML` (không sanitize riêng, theo đúng quy ước đã
 * dùng cho `OfferReviewPanel`/`EmailTemplatePreviewModal` trong repo) — an
 * toàn vì nội dung do Recruiter (role nội bộ, đã qua RBAC) nhập, không
 * phải dữ liệu ứng viên; trước đây render như text thường nên hiện ra
 * nguyên thẻ HTML thay vì định dạng (bug đã sửa).
 */
export function JobDescriptionBlocks({ description, requirements, benefits }: JobDescriptionBlocksProps) {
  return (
    <>
      <JdBlock number={1} title="Mô tả công việc" html={description} emptyText="Không có mô tả" />
      <JdBlock number={2} title="Yêu cầu ứng viên" html={requirements} emptyText="Không có yêu cầu cụ thể" />
      <JdBlock
        number={3}
        title="Quyền lợi & Đãi ngộ"
        html={benefits}
        emptyText="Không có thông tin quyền lợi"
      />
    </>
  );
}

function JdBlock({
  number,
  title,
  html,
  emptyText,
}: {
  number: number;
  title: string;
  html: string | null;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-bold text-neutral-900">
        {number}. {title}
      </h2>
      {html ? (
        <div
          className="prose prose-sm mt-3 max-w-none leading-relaxed text-neutral-700"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="mt-3 text-sm italic text-neutral-400">{emptyText}</p>
      )}
    </div>
  );
}
