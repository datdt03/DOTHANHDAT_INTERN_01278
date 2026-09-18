import { useState } from 'react';
import {
  CardPanel,
  CardPanelHeader,
  CardPanelBody,
  CardPanelFooter,
  FormGroup,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  IconButton,
  IconPlus,
  IconClose,
  IconDevices,
  IconTools,
  IconShield,
  Alert,
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

  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem(prev.length + 1)]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return; // Prevent removing when only 1 item remains
    setItems((prev) => prev.filter((_, i) => i !== index));
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

  const validateAll = (): boolean => {
    const newErrors: Record<string, Record<string, string>> = {};
    let hasError = false;

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
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleContinue = () => {
    if (validateAll()) {
      onProceed(items);
    }
  };

  const toggleShowPassword = (localId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [localId]: !prev[localId] }));
  };

  return (
    <CardPanel>
      <CardPanelHeader
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconDevices size={18} />
            <span>Giai đoạn 2: Thiết bị bàn giao và thông tin sửa chữa</span>
          </div>
        }
        actions={
          <SecondaryButton onClick={handleAddItem}>
            <IconPlus size={14} /> Thêm thiết bị khác
          </SecondaryButton>
        }
      />
      <CardPanelBody>
        <div className="rf-intake-devices-list">
          {items.map((item, index) => {
            const itemErrors = errors[item.localId] || {};
            const isPasswordRequired =
              item.credentialStatus === 'passcode_provided' ||
              item.credentialStatus === 'pin_provided';

            return (
              <div key={item.localId} className="rf-intake-device-item">
                <div className="rf-intake-device-item-header">
                  <div className="rf-intake-device-item-title">
                    <IconTools size={16} />
                    <span>Thiết bị bàn giao #{index + 1}</span>
                  </div>
                  {items.length > 1 && (
                    <IconButton
                      label="Xóa thiết bị này"
                      onClick={() => handleRemoveItem(index)}
                      style={{ color: '#ef4444' }}
                    >
                      <IconClose size={16} />
                    </IconButton>
                  )}
                </div>

                <div className="rf-intake-device-body">
                  {/* Row 1: Device Identity (4 columns) */}
                  <div className="rf-form-grid-4">
                    <FormGroup label="Loại thiết bị *" htmlFor={`type-${item.localId}`}>
                      <FormSelect
                        id={`type-${item.localId}`}
                        value={item.deviceType}
                        onChange={(e) => handleFieldChange(index, 'deviceType', e.target.value)}
                      >
                        <option value="phone">Điện thoại di động (Phone)</option>
                        <option value="tablet">Máy tính bảng (Tablet)</option>
                        <option value="laptop">Máy tính xách tay (Laptop)</option>
                        <option value="other">Thiết bị khác (Other)</option>
                      </FormSelect>
                    </FormGroup>

                    <FormGroup
                      label="Hãng sản xuất *"
                      htmlFor={`brand-${item.localId}`}
                      error={itemErrors.brand}
                    >
                      <FormInput
                        id={`brand-${item.localId}`}
                        type="text"
                        placeholder="Apple, Samsung, Dell..."
                        value={item.brand}
                        onChange={(e) => handleFieldChange(index, 'brand', e.target.value)}
                      />
                    </FormGroup>

                    <FormGroup
                      label="Model thiết bị *"
                      htmlFor={`model-${item.localId}`}
                      error={itemErrors.model}
                    >
                      <FormInput
                        id={`model-${item.localId}`}
                        type="text"
                        placeholder="iPhone 13, ThinkPad T14..."
                        value={item.model}
                        onChange={(e) => handleFieldChange(index, 'model', e.target.value)}
                      />
                    </FormGroup>

                    <FormGroup
                      label="Màu sắc / Định danh"
                      htmlFor={`identifier-${item.localId}`}
                      hint="Màu sắc, dung lượng..."
                    >
                      <FormInput
                        id={`identifier-${item.localId}`}
                        type="text"
                        placeholder="Ví dụ: Màu đen, 128GB..."
                        value={item.identifier}
                        onChange={(e) => handleFieldChange(index, 'identifier', e.target.value)}
                      />
                    </FormGroup>
                  </div>

                  {/* Row 2: Serial & Condition (3 columns) */}
                  <div className="rf-form-grid-3-spec">
                    <FormGroup
                      label="Số Serial / IMEI"
                      htmlFor={`serial-${item.localId}`}
                      hint="Tùy chọn đối chiếu"
                    >
                      <FormInput
                        id={`serial-${item.localId}`}
                        type="text"
                        placeholder="Ví dụ: F2LX90..."
                        value={item.serialNumber}
                        onChange={(e) => handleFieldChange(index, 'serialNumber', e.target.value)}
                      />
                    </FormGroup>

                    <FormGroup
                      label="Tình trạng ngoại quan khi nhận"
                      htmlFor={`condition-${item.localId}`}
                      hint="Vết xước, cấn móp sẵn có"
                    >
                      <FormInput
                        id={`condition-${item.localId}`}
                        type="text"
                        placeholder="Ví dụ: Mặt kính xước nhẹ, cấn góc dưới..."
                        value={item.handoverCondition}
                        onChange={(e) => handleFieldChange(index, 'handoverCondition', e.target.value)}
                      />
                    </FormGroup>

                    <FormGroup
                      label="Phụ kiện nhận kèm"
                      htmlFor={`accessories-${item.localId}`}
                      hint="Phụ kiện giữ cùng máy"
                    >
                      <FormInput
                        id={`accessories-${item.localId}`}
                        type="text"
                        placeholder="Ví dụ: Củ sạc 20W, cáp sạc Type-C, ốp..."
                        value={item.accessories}
                        onChange={(e) => handleFieldChange(index, 'accessories', e.target.value)}
                      />
                    </FormGroup>
                  </div>

                  {/* Row 3: Reported Issue (Required, Full Width) */}
                  <FormGroup
                    label="Lỗi khách hàng mô tả *"
                    htmlFor={`issue-${item.localId}`}
                    error={itemErrors.reportedIssue}
                    hint="Ghi nhận đúng lời khách mô tả, không tự chuyển thành chẩn đoán kỹ thuật"
                  >
                    <textarea
                      id={`issue-${item.localId}`}
                      className="rf-input rf-textarea"
                      rows={2}
                      placeholder="Ví dụ: Máy không lên nguồn sau khi sạc qua đêm; màn hình chập chờn..."
                      value={item.reportedIssue}
                      onChange={(e) => handleFieldChange(index, 'reportedIssue', e.target.value)}
                    />
                  </FormGroup>

                  {/* Row 4: Security Box & Item Notes (Balanced 2 columns) */}
                  <div className="rf-form-grid-2-bottom">
                    {/* Left: Device Credential Safety Box */}
                    <div className="rf-intake-credential-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <IconShield size={16} />
                        <span>Thông tin khóa máy và mật khẩu mở khóa</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <FormGroup label="Trạng thái khóa thiết bị" htmlFor={`cred-status-${item.localId}`}>
                          <FormSelect
                            id={`cred-status-${item.localId}`}
                            value={item.credentialStatus}
                            onChange={(e) => handleFieldChange(index, 'credentialStatus', e.target.value)}
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
                            htmlFor={`cred-val-${item.localId}`}
                            error={itemErrors.credentialValue}
                          >
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <FormInput
                                  id={`cred-val-${item.localId}`}
                                  type={showPasswordMap[item.localId] ? 'text' : 'password'}
                                  placeholder="Nhập mã mở khóa..."
                                  value={item.credentialValue}
                                  onChange={(e) => handleFieldChange(index, 'credentialValue', e.target.value)}
                                  autoComplete="new-password"
                                />
                              </div>
                              <SecondaryButton
                                type="button"
                                onClick={() => toggleShowPassword(item.localId)}
                                style={{ minWidth: '70px', padding: '0 0.5rem', flexShrink: 0 }}
                              >
                                {showPasswordMap[item.localId] ? 'Ẩn' : 'Hiện'}
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
                              checked={item.credentialConsent}
                              onChange={(e) => handleFieldChange(index, 'credentialConsent', e.target.checked)}
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
                    <div className="rf-intake-credential-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <IconTools size={16} />
                        <span>Ghi chú riêng cho thiết bị này</span>
                      </div>

                      <FormGroup
                        label=""
                        htmlFor={`notes-${item.localId}`}
                        hint="Yêu cầu đặc biệt của khách hàng cho thiết bị này"
                      >
                        <textarea
                          id={`notes-${item.localId}`}
                          className="rf-input rf-textarea"
                          rows={4}
                          placeholder="Ví dụ: Khách yêu cầu giữ nguyên dữ liệu hình ảnh, dán tem bảo hành cẩn thận..."
                          value={item.itemNotes}
                          onChange={(e) => handleFieldChange(index, 'itemNotes', e.target.value)}
                        />
                      </FormGroup>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardPanelBody>
      <CardPanelFooter>
        <div className="rf-intake-actions">
          <SecondaryButton onClick={onBack}>
            ← Quay lại Khách hàng
          </SecondaryButton>
          <div className="rf-intake-actions-right">
            <SecondaryButton onClick={handleAddItem}>
              <IconPlus size={14} /> Thêm thiết bị khác
            </SecondaryButton>
            <PrimaryButton onClick={handleContinue}>
              Tiếp tục: Kiểm tra & Xác nhận →
            </PrimaryButton>
          </div>
        </div>
      </CardPanelFooter>
    </CardPanel>
  );
}
