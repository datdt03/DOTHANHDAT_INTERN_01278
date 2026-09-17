import { useState } from 'react';
import {
  CardPanel,
  CardPanelBody,
  CardPanelHeader,
  EmptyState,
  IconAlertTriangle,
  IconClock,
  IconOrders,
  IconQueue,
  IconRefresh,
  OrderCode,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
} from '../../shared/components';

export type ScreenState = 'ready' | 'loading' | 'empty' | 'error' | 'unavailable';

interface MyWorkPlaceholderProps {
  userName?: string;
  roleTitle?: string;
}

interface AssignedTaskSummary {
  id: string;
  customer: string;
  device: string;
  issue: string;
  stage: 'diagnose' | 'repair' | 'qc';
  statusLabel: string;
  statusTone: string;
  slaDeadline: string;
  isUrgent?: boolean;
  blockedReason?: string;
}

const SAMPLE_ASSIGNED_TASKS: AssignedTaskSummary[] = [
  {
    id: 'RF-2026-0891',
    customer: 'Nguyễn Văn Hùng',
    device: 'iPhone 13 Pro',
    issue: 'Sọc sáng màn hình, liệt cảm ứng góc phải',
    stage: 'repair',
    statusLabel: 'Đang sửa chữa',
    statusTone: 'violet',
    slaDeadline: 'Còn 1h 45m (Hạn: 16:30)',
    isUrgent: true,
  },
  {
    id: 'RF-2026-0894',
    customer: 'Vũ Quốc Toàn',
    device: 'MacBook Pro M1 14"',
    issue: 'Pin phù, bàn phím kẹt phím Space',
    stage: 'diagnose',
    statusLabel: 'Chờ chẩn đoán',
    statusTone: 'blue',
    slaDeadline: 'Còn 4h 10m (Hạn: 18:00)',
  },
  {
    id: 'RF-2026-0889',
    customer: 'Hoàng Mai Phương',
    device: 'iPad Pro 11"',
    issue: 'Không nhận sạc type C, pin báo ảo',
    stage: 'qc',
    statusLabel: 'Chờ kiểm tra QC',
    statusTone: 'amber',
    slaDeadline: 'Còn 5h 30m',
  },
  {
    id: 'RF-2026-0882',
    customer: 'Trần Duy Mạnh',
    device: 'Samsung S23 Ultra',
    issue: 'Vỡ kính lưng, camera tele mờ',
    stage: 'repair',
    statusLabel: 'Tạm dừng / Bị chặn',
    statusTone: 'red',
    slaDeadline: 'Tạm ngưng SLA',
    blockedReason: 'Đang chờ linh kiện nắp lưng xanh titan về kho',
  },
];

export function TechnicianMyWorkPlaceholder({
  userName = 'Kỹ thuật viên',
  roleTitle = 'Kỹ thuật viên',
}: MyWorkPlaceholderProps) {
  const [currentState, setCurrentState] = useState<ScreenState>('ready');
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'diagnose' | 'repair' | 'qc'>('all');

  const filteredTasks = SAMPLE_ASSIGNED_TASKS.filter((task) => {
    if (activeFilter === 'urgent') return task.isUrgent;
    if (activeFilter === 'diagnose') return task.stage === 'diagnose';
    if (activeFilter === 'repair') return task.stage === 'repair';
    if (activeFilter === 'qc') return task.stage === 'qc';
    return true;
  });

  return (
    <div className="dashboard-placeholder-view">
      {/* Page Header */}
      <PageHeader
        title="Hàng chờ công việc (My Work)"
        subtitle={`Xin chào ${userName} (${roleTitle}) • Danh sách thiết bị được phân công trực tiếp, ưu tiên xử lý theo hạn cam kết SLA.`}
        eyebrow="RepairFlow / Kỹ thuật viên"
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
          <IconQueue size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--rf-text-main, #0f172a)', marginBottom: '4px' }}>
            Ranh giới kiến trúc Kỹ thuật viên (UI-A08 • Kế hoạch C1-006)
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)', lineHeight: 1.5 }}>
            Không gian làm việc: Danh sách công việc được phân công cho Kỹ thuật viên (ưu tiên theo hạn cam kết SLA). Kỹ thuật viên chỉ có quyền thao tác trên các phiếu được phân công; không có quyền xem cấu hình cửa hàng, phân công nhân sự hay metadata kiểm toán toàn workspace. Chức năng ghi nhận chẩn đoán, đề xuất báo giá, sửa chữa và kiểm tra chất lượng (QC) sẽ được tích hợp trong C6 và C9.
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
            <CardPanelHeader title="Đang nạp hàng chờ công việc..." />
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
              title="Hiện không có công việc được phân công"
              description="Bạn đã hoàn thành tất cả công việc được giao hoặc quản lý chưa phân công phiếu mới."
              action={<PrimaryButton onClick={() => setCurrentState('ready')}>Làm mới hàng chờ</PrimaryButton>}
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
                Không thể tải hàng chờ công việc
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
                Dịch vụ hàng chờ tạm thời không khả dụng
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Technician KPI strip */}
          <div className="stat-grid">
            <StatCard
              label="Việc cần làm ngay"
              value="1"
              sub="Cận hạn SLA (< 2h)"
              icon={<IconClock size={20} />}
            />
            <StatCard
              label="Đang xử lý"
              value="2"
              sub="Chẩn đoán & Sửa chữa"
              icon={<IconQueue size={20} />}
            />
            <StatCard
              label="Chờ kiểm tra QC"
              value="1"
              sub="Chờ kiểm tra chất lượng"
              icon={<IconOrders size={20} />}
            />
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--rf-border, #e2e8f0)',
              paddingBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            {(
              [
                { id: 'all', label: 'Tất cả (4)' },
                { id: 'urgent', label: 'Khẩn cấp / Cận SLA (1)' },
                { id: 'diagnose', label: 'Chờ chẩn đoán (1)' },
                { id: 'repair', label: 'Đang sửa (2)' },
                { id: 'qc', label: 'Chờ QC (1)' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: activeFilter === f.id ? 600 : 500,
                  borderRadius: 'var(--rf-radius-sm, 6px)',
                  border: 'none',
                  backgroundColor: activeFilter === f.id ? 'var(--rf-primary, #0284c7)' : 'transparent',
                  color: activeFilter === f.id ? '#ffffff' : 'var(--rf-text-muted, #64748b)',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task List */}
          <CardPanel>
            <CardPanelHeader title={`Danh sách công việc phân công (${filteredTasks.length} thiết bị)`} />
            <CardPanelBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: task.isUrgent ? '#fffbeb' : 'var(--rf-surface, #ffffff)',
                      border: '1px solid',
                      borderColor: task.isUrgent ? '#fcd34d' : 'var(--rf-border, #e2e8f0)',
                      borderRadius: 'var(--rf-radius-md, 8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <OrderCode code={task.id} />
                        <strong style={{ fontSize: '14px', color: 'var(--rf-text-main, #0f172a)' }}>
                          {task.device}
                        </strong>
                        <StatusBadge
                          label={task.statusLabel}
                          tone={task.statusTone}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: task.isUrgent ? '#b45309' : 'var(--rf-text-muted, #64748b)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <IconClock size={14} />
                        <span>{task.slaDeadline}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--rf-text-body, #334155)' }}>
                      <strong>Hiện trạng:</strong> {task.issue}
                    </div>

                    {task.blockedReason && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#b91c1c',
                          backgroundColor: '#fef2f2',
                          padding: '6px 10px',
                          borderRadius: '4px',
                        }}
                      >
                        <strong>Lý do tạm dừng:</strong> {task.blockedReason}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--rf-border, #f1f5f9)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)' }}>
                        Khách hàng: <strong>{task.customer}</strong>
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                        [Thao tác kỹ thuật sẽ kích hoạt trong C6]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardPanelBody>
          </CardPanel>
        </div>
      )}
    </div>
  );
}
