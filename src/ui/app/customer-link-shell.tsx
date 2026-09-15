import { CustomerFooter, CustomerHeader, PrimaryButton } from '../shared/components';

export function CustomerLinkShell({ orderId }: { orderId: string }) {
  return (
    <div className="customer-layout">
      <CustomerHeader storeName="Minh Tâm Store" />
      <main className="customer-content">
        <div className="customer-lockup">
          <span className="eyebrow">Liên kết theo dõi sửa chữa</span>
          <h1>Thiết bị của bạn đang được xử lý</h1>
          <p>Mã phiếu <strong className="rf-font-mono">{orderId}</strong></p>
        </div>
        <div className="customer-card">
          <div className="customer-card__status">
            <span className="status-check">✓</span>
            <div>
              <strong>Đang chờ khách duyệt báo giá</strong>
              <span>Cửa hàng đã hoàn tất chẩn đoán thiết bị.</span>
            </div>
          </div>
          <div className="customer-progress">
            <span className="is-complete" />
            <span className="is-complete" />
            <span />
            <span />
            <span />
          </div>
          <div className="customer-progress-labels">
            <span>Tiếp nhận</span>
            <span>Chẩn đoán</span>
            <span>Báo giá</span>
            <span>Sửa chữa</span>
            <span>Bàn giao</span>
          </div>
        </div>
        <div className="customer-card customer-card--quote">
          <span className="eyebrow">Báo giá mới nhất</span>
          <div className="quote-row">
            <div>
              <strong>Thay màn hình</strong>
              <span>iPhone 13 Pro</span>
            </div>
            <strong className="rf-font-mono">4.500.000 ₫</strong>
          </div>
          <div className="quote-row">
            <div>
              <strong>Vệ sinh máy</strong>
              <span>Dịch vụ tiêu chuẩn</span>
            </div>
            <strong className="rf-font-mono">250.000 ₫</strong>
          </div>
          <div className="quote-total">
            <span>Tổng cộng</span>
            <strong className="rf-font-mono">4.750.000 ₫</strong>
          </div>
          <PrimaryButton fullWidth>Xem và quyết định báo giá</PrimaryButton>
        </div>
        <p className="customer-note">Liên kết này được bảo vệ. Bạn sẽ cần mã OTP để xem chi tiết.</p>
      </main>
      <CustomerFooter storeName="Minh Tâm Store" />
    </div>
  );
}
