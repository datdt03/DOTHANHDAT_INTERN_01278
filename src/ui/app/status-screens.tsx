import { BrandMark, PrimaryButton, SecondaryButton } from '../shared/components/ui-primitives';

export function BootScreen() {
  return (
    <div className="status-screen" role="status" aria-live="polite">
      <BrandMark />
      <h1>Đang khởi động RepairFlow</h1>
      <p>Đang kiểm tra kết nối đến hệ thống...</p>
      <span className="loading-line" />
    </div>
  );
}

export function SessionCheckingScreen() {
  return (
    <div className="status-screen" role="status" aria-live="polite">
      <BrandMark />
      <h1>Đang kiểm tra phiên làm việc</h1>
      <p>Hệ thống đang xác thực danh tính và quyền truy cập...</p>
      <span className="loading-line" />
    </div>
  );
}

export function ApiUnavailableScreen({
  message,
  onRetry,
  onUsePreview,
}: {
  message: string;
  onRetry: () => void;
  onUsePreview: () => void;
}) {
  return (
    <div className="status-screen" role="alert">
      <div className="status-mark status-mark--error">!</div>
      <h1>Chưa kết nối được API</h1>
      <p>{message}</p>
      <div className="status-actions">
        <PrimaryButton onClick={onUsePreview}>Mở bản preview UI</PrimaryButton>
        <SecondaryButton onClick={onRetry}>Thử lại</SecondaryButton>
      </div>
      <small>Preview dùng dữ liệu mẫu và không ghi dữ liệu thật.</small>
    </div>
  );
}

export function GenericErrorScreen({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể xử lý yêu cầu hoặc phiên làm việc gián đoạn. Vui lòng thử lại.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="status-screen" role="alert">
      <div className="status-mark status-mark--error">!</div>
      <h1>{title}</h1>
      <p>{message}</p>
      {onRetry && (
        <div className="status-actions">
          <PrimaryButton onClick={onRetry}>Thử lại</PrimaryButton>
        </div>
      )}
    </div>
  );
}
