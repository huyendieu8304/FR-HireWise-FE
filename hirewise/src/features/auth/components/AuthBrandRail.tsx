/**
 * Rail thương hiệu bên trái cho các trang public/auth (Login, Activate...).
 * Tách riêng để LoginPage/ActivatePage dùng chung 1 bố cục — tránh lệch
 * nhau khi có trang thứ 3 (reset password) sau này. Chỉ hiện ở màn hình
 * >= lg, ẩn trên mobile để form không bị bóp nhỏ (xem LoginPage gốc).
 */
export function AuthBrandRail() {
  return (
    <div className="from-primary-700 via-primary-600 to-primary-900 relative hidden overflow-hidden bg-gradient-to-br p-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-2.5 text-lg font-bold">
        <span className="text-primary-700 flex size-7 items-center justify-center rounded-md bg-white text-sm">
          H
        </span>
        HireWise
      </div>

      <div className="max-w-sm">
        <p className="mb-3 text-xs font-semibold tracking-wider text-white/70 uppercase">
          Applicant Tracking System
        </p>
        <h1 className="text-3xl leading-tight font-semibold text-balance">
          Vận hành tuyển dụng gọn trong một nơi duy nhất.
        </h1>
        <p className="mt-3.5 text-sm leading-relaxed text-white/80">
          Từ đăng tin, sàng lọc CV bằng AI, đến ký offer điện tử — toàn bộ quy trình tuyển
          dụng của phòng nhân sự nằm trên một nền tảng.
        </p>
      </div>

      <div className="flex gap-8">
        <div>
          <b className="block text-2xl font-bold">20</b>
          <span className="text-xs text-white/70">Module nghiệp vụ</span>
        </div>
        <div>
          <b className="block text-2xl font-bold">5</b>
          <span className="text-xs text-white/70">Vai trò người dùng</span>
        </div>
      </div>
    </div>
  );
}
