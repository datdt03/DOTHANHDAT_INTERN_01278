import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import type { CustomerDto, CustomerRecordsApi } from './customer-records-api';
import { CardPanel, CardPanelBody, CardPanelHeader } from '../../shared/components/card-panel';
import { EmptyState } from '../../shared/components/empty-state';
import { Alert } from '../../shared/components/alert';
import {
  IconLookup,
  IconPlus,
  IconRefresh,
  IconChevronRight,
  IconInbox,
} from '../../shared/components/icons';

export interface CustomerSearchPanelProps {
  api: CustomerRecordsApi;
  canCreate: boolean;
  onSelectCustomer: (customer: CustomerDto) => void;
  onOpenCreate: () => void;
  previewMode?: boolean;
}

export function CustomerSearchPanel({
  api,
  canCreate,
  onSelectCustomer,
  onOpenCreate,
  previewMode = false,
}: CustomerSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const activeRequestSeq = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(
    async (queryText: string, phoneText: string) => {
      // Cancel preceding ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentSeq = ++activeRequestSeq.current;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const results = await api.searchCustomers({
          query: queryText,
          phone: phoneText,
          signal: controller.signal,
        });

        // Ensure older responses do not overwrite newer ones
        if (currentSeq === activeRequestSeq.current) {
          setCustomers(results);
          setHasSearched(true);
        }
      } catch (err: unknown) {
        if (currentSeq === activeRequestSeq.current) {
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          setErrorMessage(
            err instanceof Error && err.message
              ? err.message
              : 'Không thể tải danh sách khách hàng. Vui lòng thử lại.',
          );
        }
      } finally {
        if (currentSeq === activeRequestSeq.current) {
          setIsLoading(false);
        }
      }
    },
    [api],
  );

  // Initial load
  useEffect(() => {
    void executeSearch('', '');
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeSearch]);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      void executeSearch(searchTerm, phoneFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, phoneFilter, executeSearch]);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    void executeSearch(searchTerm, phoneFilter);
  };

  const handleRetry = () => {
    void executeSearch(searchTerm, phoneFilter);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rf-customer-area__subview">
      <CardPanel>
        <CardPanelHeader
          title="Tra cứu hồ sơ khách hàng"
          actions={
            canCreate && (
              <button
                type="button"
                className="rf-customer-search-bar__btn rf-customer-search-bar__btn--primary"
                onClick={onOpenCreate}
              >
                <IconPlus size={16} aria-hidden="true" />
                <span>Thêm khách hàng</span>
              </button>
            )
          }
        />
        <CardPanelBody>
          <form className="rf-customer-search-bar" onSubmit={handleManualSubmit}>
            <div className="rf-customer-search-bar__input-wrap">
              <IconLookup size={16} className="rf-customer-search-bar__icon" aria-hidden="true" />
              <input
                type="search"
                className="rf-customer-search-bar__input"
                placeholder="Tìm theo tên hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm theo tên hoặc số điện thoại"
              />
            </div>
            <div className="rf-customer-search-bar__input-wrap" style={{ maxWidth: '240px' }}>
              <input
                type="tel"
                className="rf-customer-search-bar__input"
                placeholder="Lọc chính xác số điện thoại"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                aria-label="Lọc chính xác số điện thoại"
              />
            </div>
            <button
              type="submit"
              className="rf-customer-search-bar__btn rf-customer-search-bar__btn--secondary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </form>
        </CardPanelBody>
      </CardPanel>

      {errorMessage && (
        <Alert variant="danger" title="Lỗi kết nối">
          <p style={{ margin: '0 0 0.5rem 0' }}>{errorMessage}</p>
          <button
            type="button"
            className="rf-customer-search-bar__btn rf-customer-search-bar__btn--secondary"
            onClick={handleRetry}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <IconRefresh size={14} aria-hidden="true" />
            <span>Thử lại</span>
          </button>
        </Alert>
      )}

      {isLoading && (
        <div className="rf-customer-skeleton-list" aria-busy="true" aria-label="Đang tải dữ liệu...">
          <div className="rf-customer-skeleton-row" />
          <div className="rf-customer-skeleton-row" />
          <div className="rf-customer-skeleton-row" />
        </div>
      )}

      {!isLoading && !errorMessage && customers.length === 0 && hasSearched && (
        <CardPanel>
          <CardPanelBody>
            <EmptyState
              icon={<IconInbox size={36} />}
              title="Không tìm thấy khách hàng phù hợp"
              description={
                searchTerm || phoneFilter
                  ? 'Không có hồ sơ khách hàng nào khớp với từ khóa tìm kiếm trong chi nhánh này.'
                  : 'Chưa có hồ sơ khách hàng nào trong không gian làm việc.'
              }
              action={
                canCreate ? (
                  <button
                    type="button"
                    className="rf-customer-search-bar__btn rf-customer-search-bar__btn--primary"
                    onClick={onOpenCreate}
                    style={{ marginTop: '0.75rem' }}
                  >
                    <IconPlus size={16} aria-hidden="true" />
                    <span>Tạo hồ sơ khách hàng mới</span>
                  </button>
                ) : undefined
              }
            />
          </CardPanelBody>
        </CardPanel>
      )}

      {!isLoading && !errorMessage && customers.length > 0 && (
        <div className="rf-customer-table-wrapper">
          <table className="rf-customer-table" aria-label="Danh sách khách hàng">
            <thead>
              <tr>
                <th scope="col">Họ và tên</th>
                <th scope="col">Số điện thoại</th>
                <th scope="col">Email</th>
                <th scope="col">Ghi chú</th>
                <th scope="col">Ngày tạo</th>
                <th scope="col" style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <span className="rf-customer-table__name">{customer.name}</span>
                  </td>
                  <td>
                    <span className="rf-customer-table__phone">{customer.phone}</span>
                  </td>
                  <td>
                    {customer.email ? (
                      <span>{customer.email}</span>
                    ) : (
                      <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>—</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '260px' }}>
                    {customer.note ? (
                      <span
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {customer.note}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
                      {formatDate(customer.createdAt)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="rf-customer-table__action-btn"
                      onClick={() => onSelectCustomer(customer)}
                      aria-label={`Xem chi tiết khách hàng ${customer.name}`}
                    >
                      <span>Xem hồ sơ</span>
                      <IconChevronRight size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
