import { useSession } from '../../app/session-context';
import { getRoleScopeDescription } from '../../app/role-entry';
import { IconShield } from '../../shared/components/icons';
import './role-navigation.css';

export function RoleNavigationBanner() {
  const { currentUser } = useSession();

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
    </div>
  );
}
