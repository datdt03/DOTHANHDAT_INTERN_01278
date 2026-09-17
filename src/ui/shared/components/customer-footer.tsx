import { IconShield } from './icons';

export interface CustomerFooterProps {
  storeName?: string;
  hotline?: string;
  address?: string;
}

export function CustomerFooter({
  storeName = 'Minh Tâm Store',
  hotline = '0988-xxx-xxx',
  address = 'Hà Nội, Việt Nam',
}: CustomerFooterProps) {
  return (
    <footer className="customer-footer" role="contentinfo">
      <p className="customer-footer__brand">{storeName}</p>
      <p className="customer-footer__meta">
        <span>Hotline: <strong>{hotline}</strong></span>
        {address && <span> • {address}</span>}
      </p>
      <p className="customer-footer__secured">
        <IconShield size={14} aria-hidden="true" />
        <span>Hệ thống theo dõi tiến độ sửa chữa thiết bị RepairFlow</span>
      </p>
    </footer>
  );
}
