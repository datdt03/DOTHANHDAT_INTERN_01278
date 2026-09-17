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
} from '../../shared/components';
import './access-shell.css';

export function AccessShell() {
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

  return (
    <div className="access-layout">
      <div className="access-container">
        {/* Brand Lockup & Workspace Identification */}
        <div className="access-header">
          <BrandMark />
          <div className="access-workspace-badge">
            <IconStore size={13} aria-hidden="true" />
            <span>Minh Tâm Store • TT Điều hành</span>
          </div>
          <h1 className="access-title">Đăng nhập RepairFlow</h1>
          <p className="access-subtitle">Hệ thống điều hành xưởng và quản lý sửa chữa</p>
        </div>

        {/* UI-A03: Session Notice / Expired Banner */}
        {sessionNotice && (
          <div className="access-expired-banner" role="alert">
            <span className="access-expired-banner__icon" aria-hidden="true">
              <IconHourglass size={15} />
            </span>
            <div className="access-expired-banner__content">
              <strong>Thông báo phiên làm việc:</strong> {sessionNotice}
            </div>
            <button
              type="button"
              className="access-expired-banner__close"
              onClick={clearSessionNotice}
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {/* UI-A01 & UI-A02: Login Form */}
        <form className="access-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="access-alert" role="alert">
              <span className="access-alert__icon" aria-hidden="true">
                <IconAlert size={15} />
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="access-email" className="form-label">
              Email tài khoản
            </label>
            <input
              id="access-email"
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
            <label htmlFor="access-password" className="form-label">
              Mật khẩu
            </label>
            <input
              id="access-password"
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
        <div className="access-quick-section">
          <div className="access-quick-header">
            <span className="access-quick-label">Đăng nhập nhanh theo vai trò (Bản phát triển)</span>
          </div>

          <div className="access-quick-grid">
            {(Object.keys(DEMO_STAFF_ACCOUNTS) as DevelopmentRole[]).map((role) => {
              const account = DEMO_STAFF_ACCOUNTS[role];
              return (
                <button
                  key={role}
                  type="button"
                  className="access-quick-btn"
                  onClick={() => quickLogin(role)}
                  title={`Đăng nhập nhanh với vai trò ${account.roleTitle}`}
                >
                  <div className="access-quick-btn__left">
                    <span className="avatar avatar--small" aria-hidden="true">
                      {account.initials}
                    </span>
                    <div>
                      <div className="access-quick-btn__role">{account.roleTitle}</div>
                      <div className="access-quick-btn__email">{account.email}</div>
                    </div>
                  </div>
                  <span className="access-quick-btn__arrow" aria-hidden="true">
                    <IconArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Public customer note & Showcase links */}
        <div className="access-footer-note">
          <p>
            Khách hàng xem tiến độ sửa chữa qua liên kết bảo mật riêng nhận qua SMS/Zalo.
            Không đăng nhập tại cổng nội bộ này.
          </p>

          <div className="access-nav-links">
            <a href="#/customer/RF-2026-0891" className="access-nav-link">
              <IconDevices size={13} aria-hidden="true" />
              <span>Xem liên kết khách hàng</span>
            </a>
            <span style={{ color: 'var(--rf-border)' }}>•</span>
            <a href="#/showcase" className="access-nav-link">
              <IconPalette size={13} aria-hidden="true" />
              <span>Thư viện UI (Showcase)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
