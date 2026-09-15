import { BrandMark, PrimaryButton, SecondaryButton } from '../shared/components/ui-primitives';

export function BootScreen() {
  return <div className="status-screen"><BrandMark /><h1>Đang khởi động RepairFlow</h1><p>Đang kiểm tra kết nối đến hệ thống...</p><span className="loading-line" /></div>;
}

export function ApiUnavailableScreen({ message, onRetry, onUsePreview }: { message: string; onRetry: () => void; onUsePreview: () => void }) {
  return <div className="status-screen"><div className="status-mark status-mark--error">!</div><h1>Chưa kết nối được API</h1><p>{message}</p><div className="status-actions"><PrimaryButton onClick={onUsePreview}>Mở bản preview UI</PrimaryButton><SecondaryButton onClick={onRetry}>Thử lại</SecondaryButton></div><small>Preview dùng dữ liệu mẫu và không ghi dữ liệu thật.</small></div>;
}
