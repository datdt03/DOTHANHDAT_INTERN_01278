import { useState } from 'react';
import type {
  CreateRepairIntakePayload,
  RepairIntakeApi,
  RepairIntakeResultDto,
} from './repair-intake-api';
import type { CustomerIntakeSelection } from './customer-intake-step';
import type { RepairItemDraft } from './repair-item-step';
import {
  CardPanel,
  CardPanelHeader,
  CardPanelBody,
  CardPanelFooter,
  FormGroup,
  FormInput,
  PrimaryButton,
  SecondaryButton,
  OrderCode,
  StatusBadge,
  Alert,
  IconCheck,
  IconCheckCircle,
  IconRefresh,
  IconOrders,
  IconDevices,
  IconCustomers,
  IconPrint,
} from '../../shared/components';

function getDefaultExpectedCompletionDate(): string {
  const target = new Date();
  target.setDate(target.getDate() + 7);
  target.setHours(17, 0, 0, 0);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface IntakeReviewStepProps {
  api: RepairIntakeApi;
  customerSelection: CustomerIntakeSelection;
  items: RepairItemDraft[];
  idempotencyKey: string;
  onBackToCustomer: () => void;
  onBackToItems: () => void;
  onResetWorkflow: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export function IntakeReviewStep({
  api,
  customerSelection,
  items,
  idempotencyKey,
  onBackToCustomer,
  onBackToItems,
  onResetWorkflow,
  onNavigateToOrder,
}: IntakeReviewStepProps) {
  const [intakeNotes, setIntakeNotes] = useState('');
  const [expectedCompletedAt, setExpectedCompletedAt] = useState(() => getDefaultExpectedCompletionDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<RepairIntakeResultDto | null>(null);

  const isExistingCustomer = customerSelection.mode === 'existing';
  const customerName = isExistingCustomer
    ? customerSelection.customer?.name
    : customerSelection.newDraft?.name;
  const customerPhone = isExistingCustomer
    ? customerSelection.customer?.phone
    : customerSelection.newDraft?.phone;
  const customerEmail = isExistingCustomer
    ? customerSelection.customer?.email
    : customerSelection.newDraft?.email;
  const customerNote = isExistingCustomer
    ? customerSelection.customer?.note
    : customerSelection.newDraft?.note;

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: CreateRepairIntakePayload = {
      customer: isExistingCustomer
        ? {
            mode: 'existing',
            id: customerSelection.customer!.id,
          }
        : {
            mode: 'new',
            name: customerSelection.newDraft!.name,
            phone: customerSelection.newDraft!.phone,
            email: customerSelection.newDraft!.email || null,
            note: customerSelection.newDraft!.note || null,
          },
      repairItems: items.map((item) => ({
        device: {
          type: item.deviceType,
          brand: item.brand.trim(),
          model: item.model.trim(),
          serialNumber: item.serialNumber.trim() || null,
          identifier: item.identifier.trim() || null,
        },
        reportedIssue: item.reportedIssue.trim(),
        handoverCondition: item.handoverCondition.trim() || null,
        accessories: item.accessories.trim() || null,
        itemNotes: item.itemNotes.trim() || null,
        credential:
          item.credentialStatus === 'not_required'
            ? null
            : {
                status: item.credentialStatus,
                value: item.credentialValue ? item.credentialValue.trim() : null,
                consent: item.credentialConsent,
              },
      })),
      repairOrder: {
        intakeNotes: intakeNotes.trim() || null,
      },
      expectedCompletedAt: expectedCompletedAt ? new Date(expectedCompletedAt).toISOString() : null,
    };

    try {
      const result = await api.submitIntake(payload, idempotencyKey);
      setSubmitResult(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message || 'Đã xảy ra lỗi khi tạo phiếu tiếp nhận.');
      } else {
        setSubmitError('Đã xảy ra lỗi không xác định khi kết nối với máy chủ.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully created, render the Success State View
  if (submitResult) {
    const order = submitResult.repairOrder;
    const customer = submitResult.customer;
    const createdItems = submitResult.repairItems || [];

    return (
      <CardPanel>
        <CardPanelBody>
          <div className="rf-intake-success-container">
            <div className="rf-intake-success-badge">
              <IconCheckCircle size={32} />
            </div>

            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--rf-text-main, #0f172a)' }}>
                Tiếp nhận sửa chữa thành công!
              </h2>
              <p style={{ margin: 0, color: 'var(--rf-text-muted, #64748b)', fontSize: '0.9375rem' }}>
                Hệ thống đã ghi nhận phiếu sửa chữa và tạo hồ sơ tiếp nhận hoàn tất trong một transaction.
              </p>
            </div>

            <div className="rf-intake-success-code">
              <span style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)', display: 'block', marginBottom: '0.25rem' }}>
                MÃ PHIẾU TIẾP NHẬN
              </span>
              <OrderCode code={order.orderCode} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <StatusBadge status="waiting" label="Trạng thái: Đã tiếp nhận (received)" />
              <span className="rf-badge">Số thiết bị: {createdItems.length}</span>
            </div>

            <div style={{ background: 'var(--rf-bg-app, #f8fafc)', border: '1px solid var(--rf-border, #e2e8f0)', borderRadius: '8px', padding: '1rem', width: '100%', maxWidth: '600px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--rf-text-muted, #64748b)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Thông tin bàn giao:
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Khách hàng: <strong>{customer.name}</strong> • SĐT: <strong>{customer.phone}</strong>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Danh sách thiết bị:
                <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                  {createdItems.map((it, idx) => (
                    <li key={it.id || idx}>
                      <strong>{it.brand} {it.model}</strong> ({it.deviceType}) — {it.reportedIssue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rf-intake-success-actions">
              <PrimaryButton onClick={() => window.print()}>
                <IconPrint size={16} /> In phiếu tiếp nhận
              </PrimaryButton>
              {onNavigateToOrder && (
                <SecondaryButton onClick={() => onNavigateToOrder(order.id)}>
                  Xem chi tiết phiếu sửa chữa →
                </SecondaryButton>
              )}
              <SecondaryButton onClick={onResetWorkflow}>
                Tiếp nhận phiếu mới
              </SecondaryButton>
            </div>

            {/* Printable Receipt Ticket (Optimized for window.print()) */}
            <div className="rf-printable-ticket" aria-label="Bản in phiếu tiếp nhận sửa chữa">
              <div className="rf-ticket-header">
                <div className="rf-ticket-shop">
                  <div className="rf-ticket-brand">RepairFlow Store</div>
                  <div className="rf-ticket-sub">Hệ thống dịch vụ & bảo hành thiết bị công nghệ</div>
                </div>
                <div className="rf-ticket-meta">
                  <div className="rf-ticket-title">PHIẾU TIẾP NHẬN SỬA CHỮA</div>
                  <div className="rf-ticket-code">Mã phiếu: <strong>{order.orderCode}</strong></div>
                  <div className="rf-ticket-date">Ngày nhận: {new Date().toLocaleString('vi-VN')}</div>
                  {expectedCompletedAt && (
                    <div className="rf-ticket-date">Hẹn hoàn thành: {new Date(expectedCompletedAt).toLocaleString('vi-VN')}</div>
                  )}
                </div>
              </div>

              <div className="rf-ticket-divider" />

              <div className="rf-ticket-section">
                <div className="rf-ticket-section-title">THÔNG TIN KHÁCH HÀNG</div>
                <div className="rf-ticket-grid-2">
                  <div>Họ và tên: <strong>{customer.name}</strong></div>
                  <div>Số điện thoại: <strong>{customer.phone}</strong></div>
                  {customer.email && <div>Email: {customer.email}</div>}
                  {customer.note && <div>Ghi chú khách: {customer.note}</div>}
                </div>
              </div>

              <div className="rf-ticket-divider" />

              <div className="rf-ticket-section">
                <div className="rf-ticket-section-title">DANH SÁCH THIẾT BỊ TIẾP NHẬN ({createdItems.length})</div>
                <table className="rf-ticket-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>STT</th>
                      <th>Thiết bị & Model</th>
                      <th>Số Serial / IMEI</th>
                      <th>Lỗi khách mô tả</th>
                      <th>Ngoại quan & Phụ kiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <strong>{item.brand} {item.model}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>({item.deviceType})</div>
                        </td>
                        <td>{item.serialNumber || '—'}</td>
                        <td>{item.reportedIssue}</td>
                        <td>
                          <div>Ngoại quan: {item.handoverCondition || 'Bình thường'}</div>
                          {item.accessories && <div>Phụ kiện: {item.accessories}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {intakeNotes && (
                <>
                  <div className="rf-ticket-divider" />
                  <div className="rf-ticket-section">
                    <div className="rf-ticket-section-title">GHI CHÚ CHUNG</div>
                    <div>{intakeNotes}</div>
                  </div>
                </>
              )}

              <div className="rf-ticket-terms">
                <p>
                  * Lưu ý: Khách hàng vui lòng xuất trình phiếu này khi nhận máy. Quý khách vui lòng kiểm tra kỹ tình trạng thiết bị và linh kiện trước khi rời quầy.
                </p>
              </div>

              <div className="rf-ticket-signatures">
                <div className="rf-ticket-signature-col">
                  <div><strong>Khách hàng bàn giao</strong></div>
                  <div className="rf-ticket-signature-hint">(Ký và ghi rõ họ tên)</div>
                  <div className="rf-ticket-signature-space" />
                  <div>{customer.name}</div>
                </div>
                <div className="rf-ticket-signature-col">
                  <div><strong>Nhân viên tiếp nhận</strong></div>
                  <div className="rf-ticket-signature-hint">(Ký và ghi rõ họ tên)</div>
                  <div className="rf-ticket-signature-space" />
                  <div>Xác nhận đã nhận máy</div>
                </div>
              </div>
            </div>
          </div>
        </CardPanelBody>
      </CardPanel>
    );
  }

  return (
    <CardPanel>
      <CardPanelHeader
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconOrders size={18} />
            <span>Giai đoạn 3: Tổng hợp và xác nhận tiếp nhận</span>
          </div>
        }
      />
      <CardPanelBody>
        <div className="rf-intake-review-card">
          {submitError && (
            <Alert variant="danger" title="Không thể tạo phiếu tiếp nhận">
              <div>{submitError}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <SecondaryButton onClick={handleSubmit} disabled={isSubmitting}>
                  <IconRefresh size={14} /> Thử gửi lại
                </SecondaryButton>
              </div>
            </Alert>
          )}

          {/* Block 1: Customer Summary */}
          <div className="rf-intake-review-block">
            <div className="rf-intake-review-block-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCustomers size={16} />
                <span>1. Khách hàng</span>
              </div>
              <SecondaryButton onClick={onBackToCustomer} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
                Chỉnh sửa
              </SecondaryButton>
            </div>
            <div className="rf-intake-review-block-content">
              <div className="rf-form-grid-3">
                <div className="rf-intake-review-field">
                  <span className="rf-intake-review-label">Họ và tên</span>
                  <span className="rf-intake-review-value">{customerName}</span>
                </div>
                <div className="rf-intake-review-field">
                  <span className="rf-intake-review-label">Số điện thoại</span>
                  <span className="rf-intake-review-value">{customerPhone}</span>
                </div>
                <div className="rf-intake-review-field">
                  <span className="rf-intake-review-label">Phân loại</span>
                  <span className="rf-intake-review-value">
                    {isExistingCustomer ? 'Khách hàng có sẵn trong hệ thống' : 'Khách hàng mới tạo'}
                  </span>
                </div>
              </div>
              {customerEmail && (
                <div className="rf-intake-review-field">
                  <span className="rf-intake-review-label">Email</span>
                  <span className="rf-intake-review-value">{customerEmail}</span>
                </div>
              )}
              {customerNote && (
                <div className="rf-intake-review-field">
                  <span className="rf-intake-review-label">Ghi chú khách</span>
                  <span className="rf-intake-review-value">{customerNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Block 2: Repeatable Devices Summary */}
          <div className="rf-intake-review-block">
            <div className="rf-intake-review-block-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconDevices size={16} />
                <span>2. Danh sách thiết bị bàn giao ({items.length} thiết bị)</span>
              </div>
              <SecondaryButton onClick={onBackToItems} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
                Chỉnh sửa
              </SecondaryButton>
            </div>
            <div className="rf-intake-review-block-content">
              {items.map((it, idx) => {
                const credLabel =
                  it.credentialStatus === 'not_required'
                    ? 'Không yêu cầu'
                    : it.credentialStatus === 'customer_unlocked_device'
                    ? 'Khách đã tự mở khóa'
                    : 'Đã cung cấp (Được mã hóa an toàn trên máy chủ)';

                return (
                  <div key={it.localId} className="rf-intake-review-device-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--rf-text-main, #0f172a)' }}>
                        #{idx + 1}. {it.brand} {it.model} ({it.deviceType})
                      </strong>
                      {it.serialNumber && (
                        <span className="rf-font-mono" style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
                          S/N: {it.serialNumber}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>Lỗi khách mô tả: </span>
                        <strong>{it.reportedIssue}</strong>
                      </div>
                      {it.handoverCondition && (
                        <div>
                          <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>Tình trạng ngoại quan: </span>
                          <span>{it.handoverCondition}</span>
                        </div>
                      )}
                      {it.accessories && (
                        <div>
                          <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>Phụ kiện kèm: </span>
                          <span>{it.accessories}</span>
                        </div>
                      )}
                      <div>
                        <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>Khóa máy: </span>
                        <span>{credLabel}</span>
                      </div>
                      {it.itemNotes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>Ghi chú riêng: </span>
                          <span>{it.itemNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block 3: Order Level Settings */}
          <div className="rf-intake-review-block">
            <div className="rf-intake-review-block-header">
              <span>3. Thông tin phiếu tiếp nhận chung</span>
            </div>
            <div className="rf-intake-review-block-content">
              <div className="rf-form-grid-2">
                <FormGroup
                  label="Ghi chú tiếp nhận chung"
                  htmlFor="intake-notes"
                  hint="Tùy chọn, thông tin chung cho toàn bộ đơn hàng"
                >
                  <FormInput
                    id="intake-notes"
                    type="text"
                    placeholder="Ví dụ: Khách hẹn lấy buổi chiều, gọi điện trước khi sửa..."
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                  />
                </FormGroup>

                <FormGroup
                  label="Thời gian dự kiến hoàn thành"
                  htmlFor="expected-complete"
                  hint="Mặc định 7 ngày kể từ ngày nhận máy (có thể thay đổi)"
                >
                  <FormInput
                    id="expected-complete"
                    type="datetime-local"
                    value={expectedCompletedAt}
                    onChange={(e) => setExpectedCompletedAt(e.target.value)}
                  />
                </FormGroup>
              </div>
            </div>
          </div>
        </div>
      </CardPanelBody>
      <CardPanelFooter>
        <div className="rf-intake-actions">
          <SecondaryButton onClick={onBackToItems} disabled={isSubmitting}>
            ← Quay lại chỉnh sửa thiết bị
          </SecondaryButton>
          <div className="rf-intake-actions-right">
            <PrimaryButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ minWidth: '220px' }}
            >
              {isSubmitting ? (
                <>
                  <IconRefresh size={14} className="rf-spin" /> Đang tạo phiếu...
                </>
              ) : (
                <>
                  <IconCheck size={14} /> Xác nhận tạo phiếu tiếp nhận
                </>
              )}
            </PrimaryButton>
          </div>
        </div>
      </CardPanelFooter>
    </CardPanel>
  );
}
