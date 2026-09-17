import { useState, type ReactNode } from 'react';
import {
  CardPanel,
  CardPanelBody,
  CardPanelHeader,
  EmptyState,
  IconAlertTriangle,
  IconClock,
  IconInbox,
  IconLookup,
  IconOrders,
  IconRefresh,
  OrderCode,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
} from '../../shared/components';

export type ScreenState = 'ready' | 'loading' | 'empty' | 'error' | 'unavailable';

interface TodayLookupPlaceholderProps {
  initialTab?: 'today' | 'lookup';
  userName?: string;
  roleTitle?: string;
}

interface LookupOrderSummary {
  orderId: string;
  customerName: string;
  customerPhone: string;
  device: string;
  serial: string;
  currentStage: string;
  statusTone: string;
  nextStep: string;
  waitingParty: string;
  customerSafeDiagnosis: string;
  quotedAmount: string;
  expectedCompletion: string;
  lastUpdated: string;
}

const SAMPLE_LOOKUP_RECORD: LookupOrderSummary = {
  orderId: 'RF-2026-0891',
  customerName: 'Nguyễn Văn Hùng',
  customerPhone: '0912 345 678',
  device: 'iPhone 13 Pro (256GB, Xanh)',
  serial: 'F2LLD0XXXXXX',
  currentStage: 'Đang sửa chữa linh kiện',
  statusTone: 'violet',
  nextStep: 'KTV thay thế cụm màn hình OLED và kiểm tra cảm ứng',
  waitingParty: 'Kỹ thuật viên (Quốc Bảo)',
  customerSafeDiagnosis: 'Màn hình bị sọc sáng và vỡ kính góc phải, liệt cảm ứng một phần. Đã được khách duyệt thay thế màn hình chính hãng.',
  quotedAmount: '4.500.000 ₫',
  expectedCompletion: 'Hôm nay, 16:30',
  lastUpdated: '15 phút trước',
};

export function ReceptionistTodayLookupPlaceholder({
  initialTab = 'today',
  userName = 'Lễ tân',
  roleTitle = 'Lễ tân tiếp nhận',
}: TodayLookupPlaceholderProps) {
  const [currentState, setCurrentState] = useState<ScreenState>('ready');
  const [activeTab, setActiveTab] = useState<'today' | 'lookup'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('0912 345 678');
  const [lookupResult, setLookupResult] = useState<LookupOrderSummary | null>(SAMPLE_LOOKUP_RECORD);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLookupResult(SAMPLE_LOOKUP_RECORD);
      setActiveTab('lookup');
    }
  };

  return (
    <div className="dashboard-placeholder-view">
      {/* Page Header */}
      <PageHeader
        title={activeTab === 'today' ? 'Tổng quan hôm nay' : 'Tra cứu tiến độ (Chế độ đọc an toàn)'}
        subtitle={`Xin chào ${userName} (${roleTitle}) • Tiếp nhận thiết bị tại quầy, tra cứu tiến độ giải đáp khách hàng và bàn giao máy.`}
        eyebrow="RepairFlow / Lễ tân tiếp nhận"
      />

      {/* Scope / Architectural Boundary Banner */}
      <div
        style={{
          backgroundColor: 'var(--rf-bg-subtle, #f1f5f9)',
          border: '1px solid var(--rf-border, #e2e8f0)',
          borderRadius: 'var(--rf-radius-md, 8px)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span style={{ color: 'var(--rf-primary, #0284c7)', marginTop: '2px' }} aria-hidden="true">
          <IconInbox size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--rf-text-main, #0f172a)', marginBottom: '4px' }}>
            Ranh giới kiến trúc Lễ tân (UI-A07 / UI-B02 • Kế hoạch C1-006)
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)', lineHeight: 1.5 }}>
            Không gian làm việc: Tiếp nhận và tra cứu tiến độ dành cho Lễ tân. Cho phép tra cứu tiến độ toàn bộ phiếu sửa chữa trong cửa hàng ở chế độ chỉ xem (Read-only) để giải đáp khách hàng; tuyệt đối không có quyền sửa chẩn đoán, đổi báo giá hay phân công nhân sự. Dữ liệu tiếp nhận và bàn giao sẽ được tích hợp trong C2, C7 và C9.
          </span>
        </div>
      </div>

      {/* Tab Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--rf-border, #e2e8f0)',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'today' ? 600 : 500,
            borderRadius: 'var(--rf-radius-md, 8px)',
            border: 'none',
            backgroundColor: activeTab === 'today' ? 'var(--rf-primary, #0284c7)' : 'transparent',
            color: activeTab === 'today' ? '#ffffff' : 'var(--rf-text-muted, #64748b)',
            cursor: 'pointer',
          }}
        >
          Tổng quan hôm nay (UI-A07)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lookup')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'lookup' ? 600 : 500,
            borderRadius: 'var(--rf-radius-md, 8px)',
            border: 'none',
            backgroundColor: activeTab === 'lookup' ? 'var(--rf-primary, #0284c7)' : 'transparent',
            color: activeTab === 'lookup' ? '#ffffff' : 'var(--rf-text-muted, #64748b)',
            cursor: 'pointer',
          }}
        >
          Tra cứu tiến độ — Read-only (UI-B02)
        </button>
      </div>

      {/* State Switcher (To verify 5 mandatory states) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--rf-text-muted, #64748b)' }}>
          Kiểm thử trạng thái giao diện:
        </span>
        {(
          [
            { id: 'ready', label: 'Sẵn sàng (Ready)' },
            { id: 'loading', label: 'Đang tải (Loading)' },
            { id: 'empty', label: 'Trống (Empty)' },
            { id: 'error', label: 'Lỗi tải (Error)' },
            { id: 'unavailable', label: 'API gián đoạn' },
          ] as const
        ).map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setCurrentState(st.id)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              borderRadius: 'var(--rf-radius-full, 9999px)',
              border: '1px solid',
              borderColor: currentState === st.id ? 'var(--rf-primary, #0284c7)' : 'var(--rf-border, #e2e8f0)',
              backgroundColor: currentState === st.id ? 'var(--rf-primary, #0284c7)' : 'var(--rf-surface, #ffffff)',
              color: currentState === st.id ? '#ffffff' : 'var(--rf-text-main, #0f172a)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Render 5 States */}
      {currentState === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="stat-grid">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '92px',
                  backgroundColor: 'var(--rf-surface, #ffffff)',
                  border: '1px solid var(--rf-border, #e2e8f0)',
                  borderRadius: 'var(--rf-radius-md, 8px)',
                  padding: '16px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ width: '40%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                <div style={{ width: '60%', height: '24px', backgroundColor: '#cbd5e1', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
          <CardPanel>
            <CardPanelHeader title="Đang nạp dữ liệu tiếp nhận & tra cứu..." />
            <CardPanelBody>
              <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                <div style={{ width: '80%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            </CardPanelBody>
          </CardPanel>
        </div>
      )}

      {currentState === 'empty' && (
        <CardPanel>
          <CardPanelBody>
            <EmptyState
              title="Chưa có phiếu tiếp nhận trong ca trực"
              description="Hôm nay chưa có lượt tiếp nhận thiết bị nào tại quầy. Bấm Tiếp nhận để tạo phiếu mới."
              action={<PrimaryButton onClick={() => setCurrentState('ready')}>Làm mới danh sách</PrimaryButton>}
            />
          </CardPanelBody>
        </CardPanel>
      )}

      {currentState === 'error' && (
        <CardPanel>
          <CardPanelBody>
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ color: '#dc2626' }}>
                <IconAlertTriangle size={36} />
              </span>
              <strong style={{ fontSize: '16px', color: 'var(--rf-text-main, #0f172a)' }}>
                Không thể tải dữ liệu tiếp nhận
              </strong>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--rf-text-muted, #64748b)', maxWidth: '400px' }}>
                Đã xảy ra sự cố khi kết nối tới máy chủ dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.
              </p>
              <SecondaryButton onClick={() => setCurrentState('ready')}>
                <IconRefresh size={14} style={{ marginRight: '6px' }} />
                <span>Thử lại</span>
              </SecondaryButton>
            </div>
          </CardPanelBody>
        </CardPanel>
      )}

      {currentState === 'unavailable' && (
        <CardPanel>
          <CardPanelBody>
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ color: '#d97706' }}>
                <IconClock size={36} />
              </span>
              <strong style={{ fontSize: '16px', color: 'var(--rf-text-main, #0f172a)' }}>
                Dịch vụ tiếp nhận tạm thời không khả dụng
              </strong>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--rf-text-muted, #64748b)', maxWidth: '440px' }}>
                Hệ thống backend chưa sẵn sàng. Ứng dụng hiện đang hiển thị giao diện mẫu theo hợp đồng C1.
              </p>
              <SecondaryButton onClick={() => setCurrentState('ready')}>
                Kiểm tra lại
              </SecondaryButton>
            </div>
          </CardPanelBody>
        </CardPanel>
      )}

      {currentState === 'ready' && (
        <>
          {activeTab === 'today' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="stat-grid">
                <StatCard
                  label="Phiếu tiếp nhận hôm nay"
                  value="--"
                  sub="Chờ kết nối C2"
                  icon={<IconInbox size={20} />}
                />
                <StatCard
                  label="Phiếu nháp chưa gửi"
                  value="--"
                  sub="Chờ kết nối C2"
                  icon={<IconOrders size={20} />}
                />
                <StatCard
                  label="Sẵn sàng bàn giao"
                  value="--"
                  sub="Chờ kết nối C7"
                  icon={<IconClock size={20} />}
                />
              </div>

              <div className="two-column-layout">
                <CardPanel>
                  <CardPanelHeader title="Hàng chờ tiếp nhận tại quầy" />
                  <CardPanelBody>
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                      <p style={{ margin: '0 0 8px' }}>
                        Danh sách khách đến gửi máy, nhận bàn giao hoặc bổ sung phụ kiện.
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                        [Placeholder C1-006: Sẽ kết nối chính thức trong C2 và C7]
                      </span>
                    </div>
                  </CardPanelBody>
                </CardPanel>

                <CardPanel>
                  <CardPanelHeader title="Phiếu chờ khách phản hồi báo giá" />
                  <CardPanelBody>
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                      <p style={{ margin: '0 0 8px' }}>
                        Theo dõi link báo giá đã gửi và hỗ trợ khách hàng khi có thắc mắc.
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                        [Placeholder C1-006: Sẽ kết nối chính thức trong C4 và C9]
                      </span>
                    </div>
                  </CardPanelBody>
                </CardPanel>
              </div>
            </div>
          )}

          {activeTab === 'lookup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Lookup Form */}
              <CardPanel>
                <CardPanelHeader title="Tra cứu tiến độ toàn cửa hàng (Read-only)" />
                <CardPanelBody>
                  <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0 12px',
                        height: '40px',
                        borderRadius: 'var(--rf-radius-md, 8px)',
                        border: '1px solid var(--rf-border, #e2e8f0)',
                        backgroundColor: 'var(--rf-surface, #ffffff)',
                      }}
                    >
                      <IconLookup size={16} style={{ color: 'var(--rf-text-muted, #64748b)' }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nhập mã phiếu (RF-2026-XXXX) hoặc số điện thoại khách hàng..."
                        style={{
                          border: 'none',
                          outline: 'none',
                          width: '100%',
                          fontSize: '13px',
                          color: 'var(--rf-text-main, #0f172a)',
                        }}
                      />
                    </div>
                    <PrimaryButton type="submit">
                      Tra cứu nhanh
                    </PrimaryButton>
                  </form>

                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--rf-bg-subtle, #f8fafc)',
                      borderRadius: 'var(--rf-radius-sm, 6px)',
                      border: '1px solid var(--rf-border, #e2e8f0)',
                      fontSize: '12px',
                      color: 'var(--rf-text-muted, #64748b)',
                    }}
                  >
                    Chế độ an toàn: Lễ tân chỉ được đọc tóm tắt tiến độ, linh kiện và chi phí đã duyệt để trao đổi với khách. Mọi nút thay đổi dữ liệu kỹ thuật, đơn giá hoặc chuyển trạng thái đều bị ẩn để đảm bảo tính toàn vẹn.
                  </div>
                </CardPanelBody>
              </CardPanel>

              {/* Sample Read-only Lookup Result Card */}
              {lookupResult && (
                <CardPanel>
                  <CardPanelHeader
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Kết quả tra cứu:</span>
                        <OrderCode code={lookupResult.orderId} />
                        <StatusBadge
                          label={lookupResult.currentStage}
                          tone={lookupResult.statusTone}
                        />
                      </div>
                    }
                  />
                  <CardPanelBody>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px',
                        marginBottom: '18px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Khách hàng
                        </span>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--rf-text-main, #0f172a)', marginTop: '2px' }}>
                          {lookupResult.customerName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)', fontFamily: 'var(--rf-font-mono)' }}>
                          {lookupResult.customerPhone}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Thiết bị & Serial
                        </span>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--rf-text-main, #0f172a)', marginTop: '2px' }}>
                          {lookupResult.device}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)', fontFamily: 'var(--rf-font-mono)' }}>
                          {lookupResult.serial}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Dự kiến hoàn tất
                        </span>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--rf-primary, #0284c7)', marginTop: '2px' }}>
                          {lookupResult.expectedCompletion}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)' }}>
                          Cập nhật: {lookupResult.lastUpdated}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Chi phí đã duyệt
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--rf-text-main, #0f172a)', fontFamily: 'var(--rf-font-mono)', marginTop: '2px' }}>
                          {lookupResult.quotedAmount}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--rf-border, #e2e8f0)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--rf-text-main, #0f172a)' }}>
                          Bước tiếp theo:{' '}
                        </strong>
                        <span style={{ fontSize: '12.5px', color: 'var(--rf-text-body, #334155)' }}>
                          {lookupResult.nextStep}
                        </span>
                      </div>
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--rf-text-main, #0f172a)' }}>
                          Bên đang phụ trách:{' '}
                        </strong>
                        <span style={{ fontSize: '12.5px', color: 'var(--rf-text-body, #334155)' }}>
                          {lookupResult.waitingParty}
                        </span>
                      </div>
                      <div>
                        <strong style={{ fontSize: '12px', color: 'var(--rf-text-main, #0f172a)' }}>
                          Tóm tắt giải thích cho khách:{' '}
                        </strong>
                        <span style={{ fontSize: '12.5px', color: 'var(--rf-text-body, #334155)' }}>
                          {lookupResult.customerSafeDiagnosis}
                        </span>
                      </div>
                    </div>
                  </CardPanelBody>
                </CardPanel>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
