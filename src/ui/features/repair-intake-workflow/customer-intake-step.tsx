import { useState, useEffect, useCallback, type FormEvent } from 'react';
import type { CustomerDto, RepairIntakeApi } from './repair-intake-api';
import {
  CardPanel,
  CardPanelHeader,
  CardPanelBody,
  CardPanelFooter,
  FormGroup,
  FormInput,
  PrimaryButton,
  SecondaryButton,
  Alert,
  EmptyState,
  SkeletonLoader,
  IconLookup,
  IconPlus,
  IconCheck,
  IconRefresh,
  IconCustomers,
} from '../../shared/components';

export interface NewCustomerDraft {
  name: string;
  phone: string;
  email: string;
  note: string;
}

export interface CustomerIntakeSelection {
  mode: 'existing' | 'new';
  customer?: CustomerDto;
  newDraft?: NewCustomerDraft;
}

interface CustomerIntakeStepProps {
  api: RepairIntakeApi;
  initialSelection?: CustomerIntakeSelection | null;
  onSelectCustomer: (selection: CustomerIntakeSelection) => void;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    return '0' + digits.slice(2);
  }
  return digits;
}

export function validatePhone(phone: string): boolean {
  const norm = normalizePhone(phone);
  return /^0[35789]\d{8}$/.test(norm);
}

export function CustomerIntakeStep({
  api,
  initialSelection,
  onSelectCustomer,
}: CustomerIntakeStepProps) {
  const [activeMode, setActiveMode] = useState<'search' | 'create'>(() => {
    return initialSelection?.mode === 'new' ? 'create' : 'search';
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerDto[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);

  // New Customer Form state
  const [newCustomer, setNewCustomer] = useState<NewCustomerDraft>(() => ({
    name: initialSelection?.newDraft?.name || '',
    phone: initialSelection?.newDraft?.phone || '',
    email: initialSelection?.newDraft?.email || '',
    note: initialSelection?.newDraft?.note || '',
  }));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateCandidate, setDuplicateCandidate] = useState<CustomerDto | null>(null);

  // Search execution
  const executeSearch = useCallback(
    async (queryText: string) => {
      const q = queryText.trim();
      if (!q) {
        setSearchResults([]);
        setSearchStatus('idle');
        return;
      }

      setSearchStatus('loading');
      setSearchErrorMessage(null);

      try {
        const results = await api.searchCustomers({ query: q, phone: q });
        setSearchResults(results);
        setSearchStatus(results.length > 0 ? 'success' : 'empty');
      } catch {
        setSearchStatus('error');
        setSearchErrorMessage('Không thể tìm kiếm khách hàng. Vui lòng kiểm tra lại kết nối.');
      }
    },
    [api]
  );

  // Debounced search when typing in search input
  useEffect(() => {
    if (activeMode !== 'search' || !searchQuery.trim()) {
      return;
    }
    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, activeMode, executeSearch]);

  // Check phone duplicate when typing in create form
  useEffect(() => {
    if (activeMode !== 'create') return;
    const phone = normalizePhone(newCustomer.phone);
    if (phone.length >= 10) {
      const controller = new AbortController();
      api
        .searchCustomers({ phone, signal: controller.signal })
        .then((found) => {
          const exactMatch = found.find(
            (c) => normalizePhone(c.phone) === phone
          );
          setDuplicateCandidate(exactMatch || null);
        })
        .catch(() => {
          // ignore duplicate check background errors
        });
      return () => controller.abort();
    } else {
      setDuplicateCandidate(null);
    }
  }, [newCustomer.phone, activeMode, api]);

  // Handle choosing an existing customer from search results
  const handleSelectExisting = (customer: CustomerDto) => {
    onSelectCustomer({
      mode: 'existing',
      customer,
    });
  };

  // Handle submitting new customer form
  const handleConfirmNewCustomer = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newCustomer.name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên khách hàng.';
    }

    const normPhone = normalizePhone(newCustomer.phone);
    if (!normPhone) {
      errors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!validatePhone(normPhone)) {
      errors.phone = 'Số điện thoại không đúng định dạng di động Việt Nam (10 số, ví dụ 0901234567).';
    }

    if (newCustomer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email.trim())) {
      errors.email = 'Email không hợp lệ.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    onSelectCustomer({
      mode: 'new',
      newDraft: {
        name: newCustomer.name.trim(),
        phone: normPhone,
        email: newCustomer.email.trim(),
        note: newCustomer.note.trim(),
      },
    });
  };

  return (
    <CardPanel>
      <CardPanelHeader
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconCustomers size={18} />
            <span>Giai đoạn 1: Thông tin khách hàng</span>
          </div>
        }
      />
      <CardPanelBody>
        {/* Mode Segmented Switch */}
        <div className="rf-intake-mode-toggle" role="tablist" aria-label="Chế độ chọn khách hàng">
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'search'}
            className={`rf-intake-mode-btn ${activeMode === 'search' ? 'rf-intake-mode-btn--active' : ''}`}
            onClick={() => setActiveMode('search')}
          >
            <IconLookup size={16} />
            <span>Tìm kiếm khách hàng có sẵn</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'create'}
            className={`rf-intake-mode-btn ${activeMode === 'create' ? 'rf-intake-mode-btn--active' : ''}`}
            onClick={() => setActiveMode('create')}
          >
            <IconPlus size={16} />
            <span>Tạo hồ sơ khách hàng mới</span>
          </button>
        </div>

        {/* Mode 1: Search Existing Customer */}
        {activeMode === 'search' && (
          <div>
            {initialSelection?.mode === 'existing' && initialSelection.customer && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="info" title="Khách hàng đang chọn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>
                      Đang chọn: <strong>{initialSelection.customer.name}</strong> • SĐT: <strong>{initialSelection.customer.phone}</strong>
                    </span>
                    <PrimaryButton type="button" onClick={() => onSelectCustomer(initialSelection)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}>
                      Tiếp tục với khách này →
                    </PrimaryButton>
                  </div>
                </Alert>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FormInput
                  type="text"
                  placeholder="Nhập số điện thoại, email hoặc họ tên khách hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<IconLookup size={16} />}
                  autoFocus
                />
              </div>
              <SecondaryButton onClick={() => executeSearch(searchQuery)}>
                Tìm kiếm
              </SecondaryButton>
            </div>

            {searchStatus === 'loading' && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SkeletonLoader height="56px" />
                <SkeletonLoader height="56px" />
              </div>
            )}

            {searchStatus === 'error' && (
              <div style={{ marginTop: '1rem' }}>
                <Alert variant="danger" title="Lỗi tìm kiếm">
                  {searchErrorMessage}
                  <div style={{ marginTop: '0.5rem' }}>
                    <SecondaryButton onClick={() => executeSearch(searchQuery)}>
                      <IconRefresh size={14} /> Thử lại
                    </SecondaryButton>
                  </div>
                </Alert>
              </div>
            )}

            {searchStatus === 'empty' && (
              <div style={{ marginTop: '1rem' }}>
                <EmptyState
                  title="Không tìm thấy khách hàng"
                  description={`Không có kết quả nào khớp với "${searchQuery}". Bạn có thể chuyển sang tạo mới.`}
                  action={
                    <PrimaryButton
                      onClick={() => {
                        const isDigits = /^\d+$/.test(searchQuery.trim());
                        setNewCustomer((prev) => ({
                          ...prev,
                          phone: isDigits ? searchQuery.trim() : prev.phone,
                          name: !isDigits ? searchQuery.trim() : prev.name,
                        }));
                        setActiveMode('create');
                      }}
                    >
                      <IconPlus size={14} /> Tạo khách hàng mới với thông tin này
                    </PrimaryButton>
                  }
                />
              </div>
            )}

            {searchStatus === 'success' && (
              <div className="rf-intake-results-list">
                <div style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
                  Tìm thấy {searchResults.length} khách hàng phù hợp:
                </div>
                {searchResults.map((customer) => (
                  <div key={customer.id} className="rf-intake-customer-card">
                    <div className="rf-intake-customer-info">
                      <span className="rf-intake-customer-name">{customer.name}</span>
                      <div className="rf-intake-customer-meta">
                        <span>Số ĐT: <strong>{customer.phone}</strong></span>
                        {customer.email && <span>Email: {customer.email}</span>}
                      </div>
                    </div>
                    <PrimaryButton onClick={() => handleSelectExisting(customer)}>
                      <IconCheck size={14} /> Chọn khách hàng này
                    </PrimaryButton>
                  </div>
                ))}
              </div>
            )}

            {searchStatus === 'idle' && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '0.875rem' }}>
                Nhập số điện thoại hoặc họ tên để tra cứu khách hàng trong hệ thống.
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Create New Customer */}
        {activeMode === 'create' && (
          <form onSubmit={handleConfirmNewCustomer}>
            {duplicateCandidate && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="warning" title="Phát hiện số điện thoại đã tồn tại">
                  <div>
                    Số điện thoại <strong>{duplicateCandidate.phone}</strong> đã thuộc về khách hàng{' '}
                    <strong>{duplicateCandidate.name}</strong> trong chi nhánh. Để tránh nhân bản dữ liệu,
                    bạn nên sử dụng hồ sơ có sẵn.
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <PrimaryButton
                      type="button"
                      onClick={() => handleSelectExisting(duplicateCandidate)}
                    >
                      <IconCheck size={14} /> Sử dụng hồ sơ {duplicateCandidate.name}
                    </PrimaryButton>
                  </div>
                </Alert>
              </div>
            )}

            <div className="rf-customer-grid">
              <FormGroup
                label="Họ và tên khách hàng *"
                htmlFor="customer-name"
                error={formErrors.name}
              >
                <FormInput
                  id="customer-name"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={newCustomer.name}
                  onChange={(e) => {
                    setNewCustomer((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) {
                      setFormErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  autoFocus
                />
              </FormGroup>

              <FormGroup
                label="Số điện thoại di động *"
                htmlFor="customer-phone"
                error={formErrors.phone}
                hint="Ví dụ: 0901234567"
              >
                <FormInput
                  id="customer-phone"
                  type="tel"
                  placeholder="0901234567"
                  value={newCustomer.phone}
                  onChange={(e) => {
                    setNewCustomer((prev) => ({ ...prev, phone: e.target.value }));
                    if (formErrors.phone) {
                      setFormErrors((prev) => ({ ...prev, phone: '' }));
                    }
                  }}
                />
              </FormGroup>

              <FormGroup
                label="Địa chỉ Email"
                htmlFor="customer-email"
                error={formErrors.email}
                hint="Tùy chọn, dùng để nhận thông báo hoặc link theo dõi"
              >
                <FormInput
                  id="customer-email"
                  type="email"
                  placeholder="an.nguyen@example.com"
                  value={newCustomer.email}
                  onChange={(e) => {
                    setNewCustomer((prev) => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) {
                      setFormErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                />
              </FormGroup>

              <FormGroup
                label="Ghi chú về khách hàng"
                htmlFor="customer-note"
                hint="Tùy chọn ghi chú cá nhân hoặc yêu cầu liên lạc"
              >
                <FormInput
                  id="customer-note"
                  type="text"
                  placeholder="Ví dụ: Khách quen, chỉ liên lạc giờ hành chính..."
                  value={newCustomer.note}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </FormGroup>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton type="submit">
                Tiếp tục: Bàn giao thiết bị →
              </PrimaryButton>
            </div>
          </form>
        )}
      </CardPanelBody>
    </CardPanel>
  );
}
