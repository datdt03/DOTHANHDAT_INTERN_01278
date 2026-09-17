import { useSession, type UserRole } from '../../app/session-context';
import { getRoleScopeDescription } from '../../app/role-entry';
import { IconShield, IconStore } from '../../shared/components/icons';
import './role-navigation.css';

interface RoleNavigationBannerProps {
  showDevSwitcher?: boolean;
}

export function RoleNavigationBanner({ showDevSwitcher = false }: RoleNavigationBannerProps) {
  const { currentUser, switchRole, sessionStatus } = useSession();

  if (!currentUser) return null;

  const role = currentUser.role;
  const scopeDescription = getRoleScopeDescription(role);

  return (
    <div className="rf-role-nav-banner" role="region" aria-label="Thông tin phân quyền phiên làm việc">
      <div className="rf-role-nav-info">
        <span className={`rf-role-nav-badge rf-role-nav-badge--${role}`}>
          <IconShield size={14} />
          <span>{currentUser.roleTitle}</span>
        </span>
        <span className="rf-role-nav-scope">
          {scopeDescription}
        </span>
      </div>

      {showDevSwitcher && (
        <div className="rf-role-nav-actions">
          <div className="rf-role-switcher">
            <span>Chuyển vai trò thử nghiệm:</span>
            {(
              [
                { id: 'manager', label: 'Quản lý' },
                { id: 'receptionist', label: 'Lễ tân' },
                { id: 'technician', label: 'Kỹ thuật' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                className={`rf-role-switcher-btn${role === r.id ? ' rf-role-switcher-btn--active' : ''}`}
                onClick={() => void switchRole(r.id)}
                disabled={sessionStatus === 'submitting'}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
