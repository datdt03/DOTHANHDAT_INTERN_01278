import { useState, type FormEvent } from 'react';
import { useSession, DEMO_STAFF_ACCOUNTS, type UserRole } from '../../app/session-context';
import { BrandMark, PrimaryButton, SecondaryButton } from '../../shared/components';

export function LoginPage() {
  const { login, quickLogin } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const success = login(email);
      if (!success) {
        setError('Email hoặc mật khẩu không chính xác. Hãy chọn tài khoản mẫu bên dưới.');
      }
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="login-layout">
      <div className="login-container">
        {/* Brand Lockup */}
        <div className="login-header">
          <BrandMark />
          <h1 className="login-title">Đăng nhập RepairFlow</h1>
          <p className="login-subtitle">Hệ thống điều hành xưởng và quản lý sửa chữa</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-alert" role="alert">
              <span className="login-alert__icon" aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email tài khoản</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="tennhanvien@repairflow.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <PrimaryButton fullWidth type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </PrimaryButton>
        </form>

        {/* Quick Demo Logins for Testing / Preview Mode */}
        <div className="quick-login-section">
          <span className="quick-login-label">Đăng nhập nhanh để kiểm thử giao diện</span>
          <div className="quick-login-grid">
            {(Object.keys(DEMO_STAFF_ACCOUNTS) as UserRole[]).map((role) => {
              const account = DEMO_STAFF_ACCOUNTS[role];
              return (
                <SecondaryButton
                  key={role}
                  className="quick-login-btn"
                  onClick={() => quickLogin(role)}
                >
                  <span className="quick-login-btn__role">{account.roleTitle}</span>
                  <span className="quick-login-btn__name">{account.name}</span>
                </SecondaryButton>
              );
            })}
          </div>
        </div>

        {/* Customer note & Showcase Link */}
        <div className="login-footer-note">
          <p>
            Khách hàng xem tiến độ qua liên kết riêng nhận qua SMS/Zalo.
            Không đăng nhập tại cổng nội bộ này.
          </p>
          <div style={{ marginTop: '12px' }}>
            <a
              href="#/showcase"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--rf-primary)',
                textDecoration: 'none',
              }}
            >
              <span>🎨</span>
              <span>Xem Thư viện Component & Tiêu chuẩn Giao diện (#/showcase)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
