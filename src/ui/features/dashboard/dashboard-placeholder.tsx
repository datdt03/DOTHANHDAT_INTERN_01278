import { useState } from 'react';
import type { UserRole } from '../../shared/api/access-api';
import {
  CardPanel,
  CardPanelBody,
  CardPanelHeader,
  EmptyState,
  IconAlertTriangle,
  IconClock,
  IconOrders,
  IconOverview,
  IconQueue,
  IconRefresh,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatCard,
} from '../../shared/components';
import { ReceptionistTodayLookupPlaceholder } from '../receptionist/today-lookup-placeholder';
import { TechnicianMyWorkPlaceholder } from '../technician/my-work-placeholder';

export type ScreenState = 'ready' | 'loading' | 'empty' | 'error' | 'unavailable';

interface DashboardPlaceholderProps {
  role?: UserRole;
  userName?: string;
  roleTitle?: string;
}

export function DashboardPlaceholder({
  role = 'manager',
  userName = 'Người dùng',
  roleTitle = 'Quản lý vận hành',
}: DashboardPlaceholderProps) {
  const [currentState, setCurrentState] = useState<ScreenState>('ready');

  // Delegate to dedicated role placeholders if requested
  if (role === 'receptionist') {
    return <ReceptionistTodayLookupPlaceholder userName={userName} roleTitle={roleTitle} />;
  }

  if (role === 'technician') {
    return <TechnicianMyWorkPlaceholder userName={userName} roleTitle={roleTitle} />;
  }

  return (
    <div className="dashboard-placeholder-view">
      {/* Page Header */}
      <PageHeader
        title="Tổng quan vận hành"
        subtitle={`Xin chào ${userName} (${roleTitle}) • Trung tâm điều phối xưởng, theo dõi tiến độ SLA và kiểm soát chất lượng dịch vụ.`}
        eyebrow="RepairFlow / Quản lý vận hành"
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
          <IconOverview size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--rf-text-main, #0f172a)', marginBottom: '4px' }}>
            Ranh giới kiến trúc Quản lý vận hành (UI-A06 • Kế hoạch C1-006)
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)', lineHeight: 1.5 }}>
            Không gian làm việc: Điều phối vận hành dành cho Quản lý / Chủ cửa hàng. Các chỉ số KPI thời gian thực, cảnh báo đơn quá hạn SLA và phân công kỹ thuật viên sẽ được kết nối chính thức trong chặng C9 sau khi hoàn tất các nghiệp vụ thành phần (C2–C8). Không tạo API hoặc dữ liệu nghiệp vụ giả lập.
          </span>
        </div>
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

      {/* Render based on Screen State */}
      {currentState === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="stat-grid">
            {[1, 2, 3, 4].map((i) => (
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
            <CardPanelHeader title="Đang nạp dữ liệu điều hành..." />
            <CardPanelBody>
              <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                <div style={{ width: '80%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ width: '60%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            </CardPanelBody>
          </CardPanel>
        </div>
      )}

      {currentState === 'empty' && (
        <CardPanel>
          <CardPanelBody>
            <EmptyState
              title="Chưa có dữ liệu vận hành"
              description="Khu vực này hiện chưa có dữ liệu phát sinh. Dữ liệu sẽ tự động hiển thị khi các đơn sửa chữa thực tế được tiếp nhận và vận hành."
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
                Không thể tải dữ liệu điều hành
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
                Dịch vụ tạm thời không khả dụng
              </strong>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--rf-text-muted, #64748b)', maxWidth: '440px' }}>
                Hệ thống phụ trách dữ liệu chưa sẵn sàng hoặc đang bảo trì. Ứng dụng hiện đang chạy ở chế độ khung ứng dụng (Shell Baseline).
              </p>
              <SecondaryButton onClick={() => setCurrentState('ready')}>
                Kiểm tra lại trạng thái
              </SecondaryButton>
            </div>
          </CardPanelBody>
        </CardPanel>
      )}

      {currentState === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="stat-grid">
            <StatCard
              label="Tiếp nhận & Chẩn đoán"
              value="--"
              sub="Chờ kết nối C9"
              icon={<IconOrders size={20} />}
            />
            <StatCard
              label="Chờ khách duyệt"
              value="--"
              sub="Chờ kết nối C9"
              icon={<IconClock size={20} />}
            />
            <StatCard
              label="Đang sửa chữa"
              value="--"
              sub="Chờ kết nối C9"
              icon={<IconQueue size={20} />}
            />
            <StatCard
              label="Chờ kiểm tra QC"
              value="--"
              sub="Chờ kết nối C9"
              icon={<IconOverview size={20} />}
            />
          </div>

          <div className="two-column-layout">
            <CardPanel>
              <CardPanelHeader title="Theo dõi tiến độ đơn sửa chữa toàn xưởng" />
              <CardPanelBody>
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 12px' }}>
                    Khu vực hiển thị danh sách phiếu sửa chữa thực tế từ backend ASP.NET Core.
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                    [Placeholder C1-006: Dữ liệu thời gian thực thuộc phạm vi C9]
                  </span>
                </div>
              </CardPanelBody>
            </CardPanel>

            <CardPanel>
              <CardPanelHeader title="Phân bổ nhân sự & Điều phối bàn sửa" />
              <CardPanelBody>
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 12px' }}>
                    Bảng phân bổ công việc theo năng lực xử lý và SLA của từng kỹ thuật viên.
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                    [Placeholder C1-006: Sẽ kết nối chính thức trong C9]
                  </span>
                </div>
              </CardPanelBody>
            </CardPanel>
          </div>
        </div>
      )}
    </div>
  );
}
