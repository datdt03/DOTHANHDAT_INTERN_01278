import { useState, type FormEvent } from 'react';
import type { CustomerDto, CustomerRecordsApi } from './customer-records-api';
import { CardPanel, CardPanelBody, CardPanelHeader } from '../../shared/components/card-panel';
import { FormGroup, FormInput } from '../../shared/components/form-controls';
import { Alert } from '../../shared/components/alert';
import { ApiClientError } from '../../shared/api/api-client';
import { IconAlertTriangle, IconCheck, IconArrowRight } from '../../shared/components/icons';

export interface CustomerCreatePanelProps {
  api: CustomerRecordsApi;
  onCustomerCreated: (customer: CustomerDto) => void;
  onCancel: () => void;
  previewMode?: boolean;
}

export function CustomerCreatePanel({
  api,
  onCustomerCreated,
  onCancel,
  previewMode = false,
}: CustomerCreatePanelProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Duplicate phone state
  const [duplicateExistingCustomer, setDuplicateExistingCustomer] = useState<CustomerDto | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  const normalizePhone = (raw: string) => {
    return raw.trim().replace(/[ ()-.]/g, '');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Vui lòng nhập họ và tên khách hàng.';
    } else if (trimmedName.length > 160) {
      errors.name = 'Họ và tên không được vượt quá 160 ký tự.';
    }

    const trimmedPhone = phone.trim();
    const normalized = normalizePhone(trimmedPhone);
    const digits = (normalized.match(/\d/g) || []).length;

    if (!trimmedPhone) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else if (digits < 6 || /[^\d+]/.test(normalized) || normalized.indexOf('+', 1) >= 0) {
      errors.phone = 'Số điện thoại không hợp lệ (tối thiểu 6 chữ số).';
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      if (trimmedEmail.length > 320) {
        errors.email = 'Email không được vượt quá 320 ký tự.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errors.email = 'Địa chỉ email không đúng định dạng.';
      }
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length > 4000) {
      errors.note = 'Ghi chú không được vượt quá 4000 ký tự.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setDuplicateNotice(null);
    setDuplicateExistingCustomer(null);

    if (previewMode) {
      setServerError('Chế độ xem trước (Preview) là chỉ đọc. Không thể lưu dữ liệu mới.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const normalizedPhone = normalizePhone(phone);

    try {
      const created = await api.createCustomer({
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim() || null,
        note: note.trim() || null,
      });

      onCustomerCreated(created);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.code === 'customer_phone_exists' || err.status === 409) {
          setDuplicateNotice(
            'Số điện thoại này đã được đăng ký trong chi nhánh. Hệ thống đã tự động tra cứu hồ sơ hiện có.',
          );

          // Call search by phone to find the existing customer profile
          try {
            const found = await api.searchCustomers({ phone: normalizedPhone });
            if (found.length > 0) {
              setDuplicateExistingCustomer(found[0]);
            }
          } catch {
            // Ignore secondary search error
          }
          return;
        }

        if (err.status === 403) {
          setServerError('Bạn không có quyền tạo hồ sơ khách hàng mới.');
          return;
        }

        if (err.status === 401) {
          setServerError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }

        setServerError(err.message || 'Không thể tạo khách hàng. Vui lòng kiểm tra lại.');
      } else {
        setServerError('Không thể kết nối tới hệ thống. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rf-customer-area__subview">
      <CardPanel>
        <CardPanelHeader title="Tiếp nhận & Tạo hồ sơ khách hàng mới" />
        <CardPanelBody>
          {previewMode && (
            <Alert variant="warning" title="Chế độ xem trước">
              Giao diện đang ở chế độ xem trước (Preview). Thao tác lưu bị vô hiệu hóa để bảo vệ dữ liệu.
            </Alert>
          )}

          {serverError && (
            <Alert variant="danger" title="Không thể tạo khách hàng">
              {serverError}
            </Alert>
          )}

          {duplicateNotice && (
            <div className="rf-customer-duplicate-panel" role="alert">
              <div className="rf-customer-duplicate-panel__header">
                <IconAlertTriangle size={18} aria-hidden="true" />
                <span>Số điện thoại đã tồn tại</span>
              </div>
              <div className="rf-customer-duplicate-panel__body">
                {duplicateNotice}
              </div>

              {duplicateExistingCustomer && (
                <div className="rf-customer-duplicate-panel__record">
                  <div className="rf-customer-duplicate-panel__record-info">
                    <span className="rf-customer-duplicate-panel__record-name">
                      {duplicateExistingCustomer.name}
                    </span>
                    <span className="rf-customer-duplicate-panel__record-phone">
                      {duplicateExistingCustomer.phone}
                    </span>
                    {duplicateExistingCustomer.email && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {duplicateExistingCustomer.email}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rf-customer-search-bar__btn rf-customer-search-bar__btn--primary"
                    onClick={() => onCustomerCreated(duplicateExistingCustomer)}
                  >
                    <span>Dùng hồ sơ hiện có</span>
                    <IconArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}

          <form className="rf-customer-form" onSubmit={handleSubmit} noValidate>
            <div className="rf-customer-form__grid">
              <FormGroup
                label="Họ và tên khách hàng *"
                htmlFor="customer-name"
                error={validationErrors.name}
              >
                <FormInput
                  id="customer-name"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationErrors.name) {
                      setValidationErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  disabled={isSubmitting || previewMode}
                  required
                />
              </FormGroup>

              <FormGroup
                label="Số điện thoại liên hệ *"
                htmlFor="customer-phone"
                error={validationErrors.phone}
                hint="Định dạng: 0912345678 hoặc +84..."
              >
                <FormInput
                  id="customer-phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) {
                      setValidationErrors((prev) => ({ ...prev, phone: '' }));
                    }
                  }}
                  disabled={isSubmitting || previewMode}
                  required
                />
              </FormGroup>

              <FormGroup
                label="Địa chỉ Email (tùy chọn)"
                htmlFor="customer-email"
                error={validationErrors.email}
              >
                <FormInput
                  id="customer-email"
                  type="email"
                  placeholder="khachhang@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  disabled={isSubmitting || previewMode}
                />
              </FormGroup>

              <div className="rf-customer-form__full">
                <FormGroup
                  label="Ghi chú đặc thù (tùy chọn)"
                  htmlFor="customer-note"
                  error={validationErrors.note}
                  hint="Tối đa 4000 ký tự"
                >
                  <textarea
                    id="customer-note"
                    className="rf-input rf-textarea"
                    rows={3}
                    placeholder="Ghi chú thêm về yêu cầu đặc biệt của khách hàng..."
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      if (validationErrors.note) {
                        setValidationErrors((prev) => ({ ...prev, note: '' }));
                      }
                    }}
                    disabled={isSubmitting || previewMode}
                  />
                </FormGroup>
              </div>
            </div>

            <div className="rf-customer-form__actions">
              <button
                type="button"
                className="rf-customer-search-bar__btn rf-customer-search-bar__btn--secondary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="rf-customer-search-bar__btn rf-customer-search-bar__btn--primary"
                disabled={isSubmitting || previewMode}
              >
                <IconCheck size={16} aria-hidden="true" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ khách hàng'}</span>
              </button>
            </div>
          </form>
        </CardPanelBody>
      </CardPanel>
    </div>
  );
}
