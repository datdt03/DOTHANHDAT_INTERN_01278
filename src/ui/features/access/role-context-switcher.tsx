import { useEffect, useId, useRef, useState } from 'react';
import { useSession, type UserRole } from '../../app/session-context';
import { getRoleScopeDescription } from '../../app/role-entry';
import { getRoleTitle } from '../../shared/api/access-api';
import { IconCheck, IconChevronDown, IconShield } from '../../shared/components/icons';
import './role-context-switcher.css';

export interface RoleContextSwitcherProps {
  inSidebar?: boolean;
  className?: string;
  onRoleSwitched?: () => void;
}

export function RoleContextSwitcher({
  inSidebar = false,
  className = '',
  onRoleSwitched,
}: RoleContextSwitcherProps = {}) {
  const { currentUser, sessionStatus, errorMessage, switchRole } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!currentUser || currentUser.roles.length < 2) {
    return null;
  }

  const activeRole = currentUser.activeRole;
  const isSwitching = sessionStatus === 'submitting';

  const handleRoleChange = async (role: UserRole) => {
    if (role === activeRole || isSwitching) {
      setIsOpen(false);
      return;
    }

    await switchRole(role);
    setIsOpen(false);
    onRoleSwitched?.();
  };

  return (
    <div className={`rf-role-context ${inSidebar ? 'rf-role-context--sidebar' : ''} ${className}`.trim()} ref={containerRef}>
      <button
        type="button"
        className="rf-role-context__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={isSwitching}
        onClick={() => setIsOpen((open) => !open)}
      >
        <IconShield size={15} aria-hidden="true" />
        <span className="rf-role-context__trigger-copy">
          <span className="rf-role-context__label">Ngữ cảnh làm việc</span>
          <strong>{getRoleTitle(activeRole)}</strong>
        </span>
        <IconChevronDown size={14} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="rf-role-context__menu" id={menuId} role="menu" aria-label="Chọn ngữ cảnh làm việc">
          <div className="rf-role-context__menu-heading">
            Chọn vai trò trong workspace hiện tại
          </div>
          {currentUser.roles.map((role) => (
            <button
              key={role}
              type="button"
              role="menuitemradio"
              aria-checked={role === activeRole}
              className={`rf-role-context__option${role === activeRole ? ' rf-role-context__option--active' : ''}`}
              onClick={() => void handleRoleChange(role)}
            >
              <span className="rf-role-context__option-copy">
                <strong>{getRoleTitle(role)}</strong>
                <span>{getRoleScopeDescription(role)}</span>
              </span>
              {role === activeRole && <IconCheck size={15} aria-hidden="true" />}
            </button>
          ))}
          {errorMessage && (
            <p className="rf-role-context__error" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
