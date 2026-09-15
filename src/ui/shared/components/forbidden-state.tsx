import type { ReactNode } from 'react';
import { IconShield } from './icons';
import { PrimaryButton, SecondaryButton } from './ui-primitives';

export interface ForbiddenStateProps {
  roleTitle?: string;
  attemptedRoute?: string;
  onGoHome?: () => void;
  onLogout?: () => void;
  action?: ReactNode;
}

export function ForbiddenState({
  roleTitle,
  attemptedRoute,
  onGoHome,
  onLogout,
  action,
}: ForbiddenStateProps) {
  return (
    <div className="rf-forbidden-container" role="alert" aria-live="assertive">
      <div className="rf-forbidden-card">
        <div className="rf-forbidden-badge">403</div>
        <div className="rf-forbidden-icon" aria-hidden="true">
          <IconShield size={38} />
        </div>
        <h2 className="rf-forbidden-title">Truy cập bị từ chối</h2>
        <p className="rf-forbidden-desc">
          Tài khoản với vai trò <strong>{roleTitle || 'của bạn'}</strong> không có quyền truy cập vào khu vực này.
          Quyền hạn và phạm vi thao tác được kiểm soát nghiêm ngặt theo chính sách bảo mật nội bộ.
        </p>

        {attemptedRoute && (
          <div className="rf-forbidden-route">
            <span>Đường dẫn yêu cầu:</span>
            <code>{attemptedRoute}</code>
          </div>
        )}

        <div className="rf-forbidden-actions">
          {action ? (
            action
          ) : (
            <>
              {onGoHome && (
                <PrimaryButton onClick={onGoHome}>
                  Quay về màn hình chính của tôi
                </PrimaryButton>
              )}
              {onLogout && (
                <SecondaryButton onClick={onLogout}>
                  Đăng xuất tài khoản
                </SecondaryButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
