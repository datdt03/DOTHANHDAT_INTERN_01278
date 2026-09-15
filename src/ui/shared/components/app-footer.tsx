export interface AppFooterProps {
  version?: string;
  systemName?: string;
  supportPhone?: string;
}

export function AppFooter({
  version = 'v0.1.0',
  systemName = 'RepairFlow — Quản Lý Vận Hành Sửa Chữa',
  supportPhone = '1900-xxxx',
}: AppFooterProps) {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__left">
        <span>{systemName}</span>
        <span className="app-footer__dot" aria-hidden="true"> • </span>
        <span className="app-footer__version">{version}</span>
      </div>
      <div className="app-footer__right">
        <span>Hỗ trợ kỹ thuật: <strong>{supportPhone}</strong></span>
      </div>
    </footer>
  );
}
