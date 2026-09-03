import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle, EnvelopeSimple, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { AppError } from '@/types/api';
import { formatCurrency } from '@/utils/formatters';
import { formatDate, formatDateTime } from '@/utils/formatters';
import {
  getPublicOfferContent,
  getPublicOfferSummary,
  requestOfferOtp,
  signOffer,
  verifyOfferOtp,
} from '../api/publicOfferApi';
import { OtpInput } from '../components/OtpInput';
import { SignaturePad } from '../components/SignaturePad';
import type { PublicOfferContent, SignatureMethod } from '../publicTypes';

const OTP_LENGTH = 6;

/**
 * UC-38 + UC-39 — trang ứng viên mở từ liên kết bảo mật trong email EM-11.
 *
 * Ứng viên không có tài khoản (SRS mục 3.1): toàn bộ xác thực là link token
 * trên URL + mã OTP gửi qua email. Trang đi qua 3 giai đoạn:
 *   1. Xác thực OTP (UC-38) — chưa thấy điều khoản nào (BR-OFFER-03).
 *   2. Đọc hợp đồng + ký (UC-38 bước 5, UC-39).
 *   3. Màn hình xác nhận đã ký.
 */
export function PublicOfferPage() {
  const { token } = useParams<{ token: string }>();

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [content, setContent] = useState<PublicOfferContent | null>(null);
  const [method, setMethod] = useState<SignatureMethod>('DRAW');
  const [typedName, setTypedName] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [signError, setSignError] = useState<string | null>(null);

  const {
    data: summary,
    isLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['public-offer', token],
    queryFn: () => getPublicOfferSummary(token!),
    enabled: !!token,
    retry: false,
  });

  // Tải lại trang trong cửa sổ xem sau khi đã verify thì lấy lại luôn nội
  // dung, ứng viên không phải nhập OTP cho mỗi lần refresh.
  useEffect(() => {
    if (summary?.otpVerified && !content && token) {
      getPublicOfferContent(token).then(setContent).catch(() => undefined);
    }
  }, [summary?.otpVerified, content, token]);

  const requestOtpMutation = useMutation({
    mutationFn: () => requestOfferOtp(token!),
    onSuccess: () => setOtpError(null),
    onError: (error) => setOtpError(messageOf(error)),
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyOfferOtp(token!, code),
    onSuccess: (data) => {
      setContent(data);
      setOtpError(null);
    },
    // ME-33: mã sai/hết hạn — hiện inline ngay dưới ô nhập, không toast.
    onError: (error) => {
      setOtpError(messageOf(error));
      setOtpCode('');
    },
  });

  const signMutation = useMutation({
    mutationFn: () =>
      signOffer(token!, {
        method,
        signatureImageBase64: method === 'DRAW' ? signatureImage : undefined,
        typedName: method === 'TYPE' ? typedName.trim() : undefined,
      }),
    onSuccess: (data) => {
      setContent(data);
      setSignError(null);
    },
    // ME-34 khi khung chữ ký còn trống, hoặc Offer đã hết hạn/đã ký.
    onError: (error) => setSignError(messageOf(error)),
  });

  if (isLoading) {
    return (
      <div className="page-container flex max-w-3xl flex-col gap-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ME-32 (hết hạn trả lời) và link hỏng đều dừng ở đây — backend cố tình
  // dùng chung một mã lỗi cho mọi lý do link không dùng được.
  if (summaryError || !summary) {
    return (
      <div className="page-container flex max-w-xl flex-col items-center gap-3 py-16 text-center">
        <WarningCircle className="size-12 text-danger-500" weight="fill" />
        <h1 className="text-xl font-semibold text-neutral-900">Không mở được thư mời</h1>
        <p className="text-sm text-neutral-600">{messageOf(summaryError)}</p>
        <p className="text-sm text-neutral-500">
          Vui lòng liên hệ Recruiter phụ trách để được hỗ trợ.
        </p>
      </div>
    );
  }

  const isSigned = content?.signed ?? false;
  const canSubmitSignature = method === 'DRAW' ? signatureImage !== '' : typedName.trim() !== '';

  return (
    <div className="page-container flex max-w-3xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">
          Thư mời làm việc — {summary.jobTitle}
        </h1>
        <p className="text-sm text-neutral-600">
          {summary.companyName} gửi tới {summary.candidateName}. Hạn trả lời:{' '}
          <strong className="text-neutral-800">{formatDateTime(summary.expiresAt)}</strong>
        </p>
      </header>

      {/* Giai đoạn 1 — UC-38: chưa xác thực thì không hiện bất kỳ điều khoản nào. */}
      {!content && (
        <section className="flex flex-col items-center gap-5 rounded-md border border-neutral-200 bg-white p-8">
          <EnvelopeSimple className="size-10 text-primary-600" />
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-base font-semibold text-neutral-900">Xác thực để xem thư mời</h2>
            <p className="max-w-md text-sm text-neutral-600">
              Vì lý do bảo mật, nội dung hợp đồng chỉ hiển thị sau khi bạn nhập mã xác thực gửi tới{' '}
              <strong className="text-neutral-800">{summary.maskedEmail}</strong>.
            </p>
          </div>

          {requestOtpMutation.isSuccess ? (
            <>
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => verifyMutation.mutate(code)}
                disabled={verifyMutation.isPending}
                error={otpError ?? undefined}
              />
              <div className="flex items-center gap-3">
                <Button
                  isLoading={verifyMutation.isPending}
                  disabled={otpCode.length !== OTP_LENGTH}
                  onClick={() => verifyMutation.mutate(otpCode)}
                >
                  Xác nhận
                </Button>
                <Button
                  variant="ghost"
                  isLoading={requestOtpMutation.isPending}
                  onClick={() => {
                    setOtpCode('');
                    requestOtpMutation.mutate();
                  }}
                >
                  Gửi lại mã
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                isLoading={requestOtpMutation.isPending}
                onClick={() => requestOtpMutation.mutate()}
              >
                Gửi mã xác thực
              </Button>
              {otpError && <p className="text-sm text-danger-600">{otpError}</p>}
            </>
          )}
        </section>
      )}

      {/* Giai đoạn 2 & 3 — nội dung hợp đồng, rồi khung ký hoặc màn hình đã ký. */}
      {content && (
        <>
          {isSigned && (
            <div className="flex items-start gap-3 rounded-md border border-success-200 bg-success-50 p-4 text-sm text-success-800">
              <CheckCircle className="mt-0.5 size-5 shrink-0" weight="fill" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Bạn đã ký xác nhận thư mời thành công.</span>
                <span>
                  Thời điểm ký: {content.signedAt ? formatDateTime(content.signedAt) : '—'}. Bản hợp
                  đồng đã ký được gửi kèm trong email xác nhận.
                </span>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-neutral-500">Mức lương chính thức</dt>
                <dd className="font-medium text-neutral-900">{formatCurrency(content.salary)}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-neutral-500">Tỷ lệ thử việc</dt>
                <dd className="font-medium text-neutral-900">
                  {content.probationRate !== null ? `${content.probationRate}%` : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-neutral-500">Ngày nhận việc</dt>
                <dd className="font-medium text-neutral-900">{formatDate(content.startDate)}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-neutral-500">Hạn trả lời</dt>
                <dd className="font-medium text-neutral-900">{formatDateTime(content.expiresAt)}</dd>
              </div>
            </dl>

            {/*
              Backend đã HTML-escape mọi giá trị thay vào template khi render
              (OfferTemplateRenderer); phần markup còn lại là khung cố định do
              HR soạn, không phải dữ liệu ứng viên nhập.
            */}
            <div
              className="rounded-md border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-800"
              dangerouslySetInnerHTML={{ __html: content.renderedBody }}
            />
          </section>

          {!isSigned && (
            <section className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-6">
              <h2 className="text-base font-semibold text-neutral-900">Ký xác nhận</h2>
              <SignaturePad
                method={method}
                onMethodChange={setMethod}
                typedName={typedName}
                onTypedNameChange={setTypedName}
                onDrawingChange={setSignatureImage}
                disabled={signMutation.isPending}
              />

              {signError && (
                <p className="flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
                  <WarningCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{signError}</span>
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  isLoading={signMutation.isPending}
                  disabled={!canSubmitSignature}
                  onClick={() => signMutation.mutate()}
                >
                  Hoàn tất ký Offer
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** Lấy message hiển thị được từ lỗi đã chuẩn hóa của apiClient. */
function messageOf(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
