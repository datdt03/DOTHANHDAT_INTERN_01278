import { BrandMark } from './ui-primitives';

export interface CustomerHeaderProps {
  storeName?: string;
}

export function CustomerHeader({ storeName = 'Minh Tâm Store' }: CustomerHeaderProps) {
  return (
    <header className="customer-header">
      <BrandMark />
      <strong>RepairFlow</strong>
      <span>{storeName}</span>
    </header>
  );
}
