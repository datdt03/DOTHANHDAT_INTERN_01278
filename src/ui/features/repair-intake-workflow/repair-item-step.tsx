import { useState } from 'react';
import {
  FormGroup,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  IconPlus,
  IconDevices,
  IconTools,
  IconShield,
} from '../../shared/components';

export interface RepairItemDraft {
  localId: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  identifier: string;
  reportedIssue: string;
  handoverCondition: string;
  accessories: string;
  itemNotes: string;
  credentialStatus: string;
  credentialValue: string;
  credentialConsent: boolean;
}

interface RepairItemStepProps {
  initialItems?: RepairItemDraft[];
  onBack: () => void;
  onProceed: (items: RepairItemDraft[]) => void;
}

export function createEmptyItem(index: number): RepairItemDraft {
  return {
    localId: `item-${Date.now()}-${index}`,
    deviceType: 'phone',
    brand: '',
    model: '',
    serialNumber: '',
    identifier: '',
    reportedIssue: '',
    handoverCondition: '',
    accessories: '',
    itemNotes: '',
    credentialStatus: 'not_required',
    credentialValue: '',
    credentialConsent: false,
  };
}

export function RepairItemStep({
  initialItems,
  onBack,
  onProceed,
}: RepairItemStepProps) {
  const [items, setItems] = useState<RepairItemDraft[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [createEmptyItem(1)];
  });

  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const currentIndex = Math.min(activeDeviceIndex, Math.max(0, items.length - 1));
  const currentItem = items[currentIndex] || items[0];

  const handleAddItem = () => {
    setItems((prev) => {
      const next = [...prev, createEmptyItem(prev.length + 1)];
      setActiveDeviceIndex(next.length - 1);
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return; // Prevent removing when only 1 item remains
    setItems((prev) => prev.filter((_, i) => i !== index));
    setActiveDeviceIndex((prev) => (prev >= index ? Math.max(0, prev - 1) : prev));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[items[index].localId];
      return next;
    });
  };

  const handleFieldChange = (
    index: number,
    field: keyof RepairItemDraft,
    value: string | boolean
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear error for this field if any
    const localId = items[index].localId;
    if (errors[localId]?.[field as string]) {
      setErrors((prev) => ({
        ...prev,
        [localId]: {
          ...prev[localId],
          [field as string]: '',
        },
      }));
    }
  };

  const handleAddAccessoryChip = (index: number, chipText: string) => {
    const current = items[index].accessories || '';
    if (chipText === 'Không phụ kiện') {
      handleFieldChange(index, 'accessories', 'Không có phụ kiện kèm theo');
      return;
    }
    if (!current.trim()) {
      handleFieldChange(index, 'accessories', chipText);
    } else if (!current.includes(chipText)) {
      handleFieldChange(index, 'accessories', `${current}, ${chipText}`);
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, Record<string, string>> = {};
    let firstErrorIndex = -1;

    items.forEach((item, index) => {
      const itemErr: Record<string, string> = {};

      if (!item.brand.trim()) {
        itemErr.brand = 'Vui lòng nhập hãng sản xuất (Apple, Samsung...).';
      }
      if (!item.model.trim()) {
        itemErr.model = 'Vui lòng nhập model máy (iPhone 13, Tab S8...).';
      }
      if (!item.reportedIssue.trim()) {
        itemErr.reportedIssue = 'Vui lòng nhập mô tả lỗi do khách hàng phản ánh.';
      }

      const needsPassword =
        item.credentialStatus === 'passcode_provided' ||
        item.credentialStatus === 'pin_provided';

      if (needsPassword) {
        if (!item.credentialConsent) {
          itemErr.credentialConsent = 'Khách hàng cần xác nhận đồng ý cung cấp mật khẩu.';
        }
        if (!item.credentialValue.trim()) {
          itemErr.credentialValue = 'Vui lòng nhập mật khẩu/mã PIN đã được khách cung cấp.';
        }
      }

      if (Object.keys(itemErr).length > 0) {
        newErrors[item.localId] = itemErr;
        if (firstErrorIndex === -1) {
          firstErrorIndex = index;
        }
      }
    });

    setErrors(newErrors);
    if (firstErrorIndex !== -1) {
      setActiveDeviceIndex(firstErrorIndex);
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (validateAll()) {
      onProceed(items);
    }
  };

  const toggleShowPassword = (localId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [localId]: !prev[localId] }));
  };

  const itemErrors = errors[currentItem.localId] || {};
  const isPasswordRequired =
    currentItem.credentialStatus === 'passcode_provided' ||
    currentItem.credentialStatus === 'pin_provided';

  return (
    <div className="rf-intake-surface">
      {/* Multi-Device Tabs or Single Device Minimal Bar */}
      {items.length > 1 ? (
        <div className="rf-device-tabs-bar">
          <div className="rf-device-tabs-list" role="tablist" aria-label="Danh sách thiết bị tiếp nhận">
            {items.map((item, idx) => {
              const hasErr = Boolean(errors[item.localId] && Object.values(errors[item.localId]).some(Boolean));
              const isActive = idx === currentIndex;
              const displayName = item.model.trim() || `Thiết bị #${idx + 1}`;

              return (
                <button
                  key={item.localId}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`rf-device-tab ${isActive ? 'rf-device-tab--active' : ''}`}
                  onClick={() => setActiveDeviceIndex(idx)}
                >
                  <IconDevices size={14} />
                  <span>{displayName}</span>
                  {hasErr && (
                    <span
                      className="rf-device-tab-badge rf-device-tab-badge--error"
                      title="Thiết bị có thông tin cần bổ sung"
                    />
                  )}
                  {items.length > 1 && (
                    <span
                      className="rf-device-tab-close"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(idx);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          handleRemoveItem(idx);
                        }
                      }}
                      title="Xóa thiết bị này"
                      aria-label={`Xóa ${displayName}`}
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="rf-device-tab-add-btn"
            onClick={handleAddItem}
          >
            <IconPlus size={14} /> Thêm thiết bị khác
          </button>
        </div>
      ) : (
        <div className="rf-device-single-bar">
          <div className="rf-device-single-title">
            <IconDevices size={18} />
            <span>Thiết bị bàn giao & Thông tin sửa chữa</span>
          </div>
          <SecondaryButton onClick={handleAddItem} style={{ fontSize: '0.8125rem' }}>
            <IconPlus size={14} /> Thêm thiết bị khác
          </SecondaryButton>
        </div>
      )}

      {/* Single Clean Canvas Body (No nested boxes) */}
      <div className="rf-intake-canvas-body">
        {/* Section 1: Thông tin thiết bị */}
        <div className="rf-intake-section">
          <div className="rf-intake-section-header">
            <div className="rf-intake-section-title">
              <span className="rf-intake-section-indicator" />
              <span>1. Thông tin thiết bị</span>
            </div>
            {items.length > 1 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--rf-text-muted, #64748b)' }}>
                Đang thao tác: <strong>Thiết bị #{currentIndex + 1}</strong>
              </span>
            )}
          </div>

          <div className="rf-form-grid-4">
            <FormGroup label="Loại thiết bị *" htmlFor={`type-${currentItem.localId}`}>
              <FormSelect
                id={`type-${currentItem.localId}`}
                value={currentItem.deviceType}
                onChange={(e) => handleFieldChange(currentIndex, 'deviceType', e.target.value)}
              >
                <option value="phone">Điện thoại di động (Phone)</option>
                <option value="tablet">Máy tính bảng (Tablet)</option>
                <option value="laptop">Máy tính xách tay (Laptop)</option>
                <option value="other">Thiết bị khác (Other)</option>
              </FormSelect>
            </FormGroup>

            <FormGroup
              label="Hãng sản xuất *"
              htmlFor={`brand-${currentItem.localId}`}
              error={itemErrors.brand}
            >
              <FormInput
                id={`brand-${currentItem.localId}`}
                type="text"
                placeholder="Apple, Samsung, Dell..."
                value={currentItem.brand}
                onChange={(e) => handleFieldChange(currentIndex, 'brand', e.target.value)}
              />
            </FormGroup>

            <FormGroup
              label="Model thiết bị *"
              htmlFor={`model-${currentItem.localId}`}
              error={itemErrors.model}
            >
              <FormInput
                id={`model-${currentItem.localId}`}
                type="text"
                placeholder="iPhone 13, ThinkPad T14..."
                value={currentItem.model}
                onChange={(e) => handleFieldChange(currentIndex, 'model', e.target.value)}
              />
            </FormGroup>

            <FormGroup
              label="Màu sắc / Định danh"
              htmlFor={`identifier-${currentItem.localId}`}
              hint="Màu sắc, dung lượng..."
            >
              <FormInput
                id={`identifier-${currentItem.localId}`}
                type="text"
                placeholder="Ví dụ: Màu đen, 128GB..."
                value={currentItem.identifier}
                onChange={(e) => handleFieldChange(currentIndex, 'identifier', e.target.value)}
              />
            </FormGroup>
          </div>
        </div>

        <div className="rf-intake-divider" />

        {/* Section 2: Hiện trạng & Phụ kiện */}
        <div className="rf-intake-section">
          <div className="rf-intake-section-header">
            <div className="rf-intake-section-title">
              <span className="rf-intake-section-indicator" />
              <span>2. Hiện trạng tiếp nhận & Phụ kiện kèm</span>
            </div>
          </div>

          <div className="rf-form-grid-3-spec">
            <FormGroup
              label="Số Serial / IMEI"
              htmlFor={`serial-${currentItem.localId}`}
              hint="Tùy chọn đối chiếu"
            >
              <FormInput
                id={`serial-${currentItem.localId}`}
                type="text"
                placeholder="Ví dụ: F2LX90..."
                value={currentItem.serialNumber}
                onChange={(e) => handleFieldChange(currentIndex, 'serialNumber', e.target.value)}
              />
            </FormGroup>

            <FormGroup
              label="Tình trạng ngoại quan khi nhận"
              htmlFor={`condition-${currentItem.localId}`}
              hint="Vết xước, cấn móp sẵn có"
            >
              <FormInput
                id={`condition-${currentItem.localId}`}
                type="text"
                placeholder="Ví dụ: Mặt kính xước nhẹ, cấn góc dưới..."
                value={currentItem.handoverCondition}
                onChange={(e) => handleFieldChange(currentIndex, 'handoverCondition', e.target.value)}
              />
            </FormGroup>

            <FormGroup
              label="Phụ kiện nhận kèm"
              htmlFor={`accessories-${currentItem.localId}`}
              hint="Phụ kiện giữ cùng máy"
            >
              <FormInput
                id={`accessories-${currentItem.localId}`}
                type="text"
                placeholder="Ví dụ: Củ sạc 20W, cáp sạc Type-C, ốp..."
                value={currentItem.accessories}
                onChange={(e) => handleFieldChange(currentIndex, 'accessories', e.target.value)}
              />
              <div className="rf-quick-chips">
                <span className="rf-quick-chips-label">Thêm nhanh:</span>
                <button
                  type="button"
                  className="rf-quick-chip"
                  onClick={() => handleAddAccessoryChip(currentIndex, 'Củ sạc')}
                >
                  + Củ sạc
                </button>
                <button
                  type="button"
                  className="rf-quick-chip"
                  onClick={() => handleAddAccessoryChip(currentIndex, 'Cáp sạc Type-C')}
                >
                  + Cáp sạc Type-C
                </button>
                <button
                  type="button"
                  className="rf-quick-chip"
                  onClick={() => handleAddAccessoryChip(currentIndex, 'Ốp lưng')}
                >
                  + Ốp lưng
                </button>
                <button
                  type="button"
                  className="rf-quick-chip"
                  onClick={() => handleAddAccessoryChip(currentIndex, 'Không phụ kiện')}
                >
                  ∅ Không phụ kiện
                </button>
              </div>
            </FormGroup>
          </div>
        </div>

        <div className="rf-intake-divider" />

        {/* Section 3: Lỗi khách hàng mô tả */}
        <div className="rf-intake-section">
          <div className="rf-intake-section-header">
            <div className="rf-intake-section-title">
              <span className="rf-intake-section-indicator" />
              <span>3. Lỗi khách hàng mô tả *</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--rf-text-muted, #64748b)', fontStyle: 'italic' }}>
              Ghi nhận đúng lời khách mô tả, không tự chuyển thành chẩn đoán kỹ thuật
            </span>
          </div>

          <FormGroup
            label=""
            htmlFor={`issue-${currentItem.localId}`}
            error={itemErrors.reportedIssue}
          >
            <textarea
              id={`issue-${currentItem.localId}`}
              className="rf-input rf-textarea"
              rows={2}
              placeholder="Ví dụ: Máy không lên nguồn sau khi sạc qua đêm; màn hình chập chờn..."
              value={currentItem.reportedIssue}
              onChange={(e) => handleFieldChange(currentIndex, 'reportedIssue', e.target.value)}
            />
          </FormGroup>
        </div>

        <div className="rf-intake-divider" />

        {/* Section 4: Khóa máy & Ghi chú riêng (2 columns balanced) */}
        <div className="rf-form-grid-2-bottom">
          {/* Left: Device Credential Safety Panel */}
          <div className="rf-bottom-section-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                <IconShield size={16} />
                <span>Thông tin khóa máy & Mật khẩu</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 500, border: '1px solid #a7f3d0' }}>
                Bảo mật an toàn
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FormGroup label="Trạng thái khóa thiết bị" htmlFor={`cred-status-${currentItem.localId}`}>
                <FormSelect
                  id={`cred-status-${currentItem.localId}`}
                  value={currentItem.credentialStatus}
                  onChange={(e) => handleFieldChange(currentIndex, 'credentialStatus', e.target.value)}
                >
                  <option value="not_required">Không yêu cầu mật khẩu</option>
                  <option value="customer_unlocked_device">Khách đã tự mở khóa máy</option>
                  <option value="passcode_provided">Khách cung cấp mã PIN / Mật khẩu</option>
                  <option value="pattern_provided">Khách cung cấp hình vẽ mở khóa</option>
                </FormSelect>
              </FormGroup>

              {isPasswordRequired && (
                <FormGroup
                  label="Mật khẩu / Mã PIN *"
                  htmlFor={`cred-val-${currentItem.localId}`}
                  error={itemErrors.credentialValue}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FormInput
                        id={`cred-val-${currentItem.localId}`}
                        type={showPasswordMap[currentItem.localId] ? 'text' : 'password'}
                        placeholder="Nhập mã mở khóa..."
                        value={currentItem.credentialValue}
                        onChange={(e) => handleFieldChange(currentIndex, 'credentialValue', e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <SecondaryButton
                      type="button"
                      onClick={() => toggleShowPassword(currentItem.localId)}
                      style={{ minWidth: '70px', padding: '0 0.5rem', flexShrink: 0 }}
                    >
                      {showPasswordMap[currentItem.localId] ? 'Ẩn' : 'Hiện'}
                    </SecondaryButton>
                  </div>
                </FormGroup>
              )}
            </div>

            {isPasswordRequired && (
              <div style={{ marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={currentItem.credentialConsent}
                    onChange={(e) => handleFieldChange(currentIndex, 'credentialConsent', e.target.checked)}
                  />
                  <span>Khách hàng đã đồng ý cung cấp mật khẩu để phục vụ kỹ thuật kiểm tra.</span>
                </label>
                {itemErrors.credentialConsent && (
                  <div className="blocked-hint" style={{ marginTop: '0.25rem' }}>
                    {itemErrors.credentialConsent}
                  </div>
                )}
              </div>
            )}

            <p className="rf-intake-credential-notice" style={{ margin: 0 }}>
              * Lưu ý bảo mật: Mật khẩu được mã hóa an toàn và tự động hủy sau khi bàn giao máy.
            </p>
          </div>

          {/* Right: Item Notes */}
          <div className="rf-bottom-section-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              <IconTools size={16} />
              <span>Ghi chú riêng cho thiết bị này</span>
            </div>

            <FormGroup
              label=""
              htmlFor={`notes-${currentItem.localId}`}
              hint="Yêu cầu đặc biệt của khách hàng cho thiết bị này"
            >
              <textarea
                id={`notes-${currentItem.localId}`}
                className="rf-input rf-textarea"
                rows={4}
                placeholder="Ví dụ: Khách yêu cầu giữ nguyên dữ liệu hình ảnh, dán tem bảo hành cẩn thận..."
                value={currentItem.itemNotes}
                onChange={(e) => handleFieldChange(currentIndex, 'itemNotes', e.target.value)}
              />
            </FormGroup>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="rf-intake-footer">
        <SecondaryButton onClick={onBack}>
          ← Quay lại: Khách hàng
        </SecondaryButton>
        <div className="rf-intake-footer-right">
          {items.length === 1 && (
            <SecondaryButton onClick={handleAddItem}>
              <IconPlus size={14} /> Thêm thiết bị khác
            </SecondaryButton>
          )}
          <PrimaryButton onClick={handleContinue}>
            Tiếp tục: Tổng hợp & Xác nhận →
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
