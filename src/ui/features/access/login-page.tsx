import { useState, type FormEvent } from 'react';
import { useSession, DEMO_STAFF_ACCOUNTS, type DevelopmentRole } from '../../app/session-context';
import {
  BrandMark,
  IconAlert,
  IconArrowRight,
  IconDevices,
  IconHourglass,
  IconPalette,
  IconStore,
  PrimaryButton,
  SecondaryButton,
} from '../../shared/components';

export function LoginPage() {
  const { login, quickLogin, sessionNotice, clearSessionNotice } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email tài khoản.');
      return;
    }

    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.errorMessage || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  const simulateError = () => {
    setError('Email hoặc mật khẩu không chính xác. (Mô phỏng lỗi xác thực UI-A02)');
  };

  return (
    <div className="login-layout">
      <div className="login-container">
        {/* Brand Lockup & Workspace Identification */}
        <div className="login-header">
          <BrandMark />
          <div className="login-workspace-badge">
            <IconStore size={13} aria-hidden="true" />
            <span>Cửa hàng: Minh Tâm Store</span>
          </div>
          <h1 className="login-title">Đăng nhập RepairFlow</h1>
          <p className="login-subtitle">Hệ thống điều hành xưởng và quản lý sửa chữa</p>
        </div>

        {/* UI-A03: Session Expired or Account Locked Notice */}
        {sessionNotice && (
          <div className="login-expired-banner" role="alert">
            <span className="login-expired-banner__icon" aria-hidden="true">
              <IconHourglass size={15} />
            </span>
            <div className="login-expired-banner__content">
              <strong>Thông báo phiên làm việc:</strong> {sessionNotice}
            </div>
            <button
              type="button"
              className="login-expired-banner__close"
              onClick={clearSessionNotice}
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {/* UI-A01 & UI-A02: Login Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-alert" role="alert">
              <span className="login-alert__icon" aria-hidden="true">
                <IconAlert size={15} />
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email tài khoản
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="tennhanvien@repairflow.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <PrimaryButton fullWidth type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </PrimaryButton>
        </form>

        {/* Quick Demo Logins for rapid testing & persona switching */}
        <div className="quick-login-section">
          <div className="quick-login-header">
            <span className="quick-login-label">Đăng nhập nhanh theo vai trò (Demo)</span>
          </div>

          <div className="quick-login-grid">
            {(Object.keys(DEMO_STAFF_ACCOUNTS) as DevelopmentRole[]).map((role) => {
              const account = DEMO_STAFF_ACCOUNTS[role];
              return (
                <SecondaryButton
                  key={role}
                  className="quick-login-btn"
                  onClick={() => quickLogin(role)}
                  title={`Đăng nhập nhanh với vai trò ${account.roleTitle}`}
                >
                  <div className="quick-login-btn__left">
                    <span className="avatar avatar--small" aria-hidden="true">
                      {account.initials}
                    </span>
                    <div>
                      <div className="quick-login-btn__role">{account.roleTitle}</div>
                      <div className="quick-login-btn__email">{account.email}</div>
                    </div>
                  </div>
                  <span className="quick-login-btn__arrow" aria-hidden="true">
                    <IconArrowRight size={14} />
                  </span>
                </SecondaryButton>
              );
            })}
          </div>

          {/* Test State Triggers */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={simulateError}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--rf-text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Test lỗi UI-A02
            </button>
          </div>
        </div>

        {/* Public customer note & Showcase links */}
        <div className="login-footer-note">
          <p>
            Khách hàng xem tiến độ sửa chữa qua liên kết bảo mật riêng nhận qua SMS/Zalo.
            Không đăng nhập tại cổng nội bộ này.
          </p>

          <div className="login-nav-links">
            <a href="#/customer/RF-2026-0891" className="login-nav-link">
              <IconDevices size={13} aria-hidden="true" />
              <span>Xem link Khách hàng</span>
            </a>
            <span style={{ color: 'var(--rf-border)' }}>•</span>
            <a href="#/showcase" className="login-nav-link">
              <IconPalette size={13} aria-hidden="true" />
              <span>Thư viện UI (Showcase)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
