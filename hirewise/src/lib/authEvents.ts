/**
 * Kênh sự kiện nhẹ để lớp non-React (apiClient interceptor) báo cho lớp React
 * (App/router) biết phiên đăng nhập đã hết hạn, mà không tạo dependency
 * ngược (axios không thể `import` router hay React context trực tiếp).
 */

type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitUnauthorized(): void {
  listeners.forEach((listener) => listener());
}
