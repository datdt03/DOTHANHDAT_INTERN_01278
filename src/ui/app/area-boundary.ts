import type { ComponentType } from 'react';
import type { RoleCapabilities, UserRole } from '../shared/api/access-api';

export const C2_AREA_IDS = [
  'customer-records-area',
  'device-area',
  'repair-order-area',
  'repair-intake-workflow',
] as const;

export type C2AreaId = (typeof C2_AREA_IDS)[number];

export interface AreaMountContext {
  workspaceId: string;
  activeRole: UserRole;
  roles: UserRole[];
  capabilities: RoleCapabilities;
}

export interface C2AreaMountProps {
  context: AreaMountContext;
  onNavigate: (area: C2AreaId, resourceId?: string) => void;
}

export type C2AreaComponent = ComponentType<C2AreaMountProps>;

export function isC2AreaId(value: string): value is C2AreaId {
  return (C2_AREA_IDS as readonly string[]).includes(value);
}
