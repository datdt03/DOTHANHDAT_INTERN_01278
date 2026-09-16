import { useState } from 'react';
import type { UserRole } from '../../shared/api/access-api';
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
  IconOverview,
  IconQueue,
  IconRefresh,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatCard,
} from '../../shared/components';

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

  const getRoleConfig = () => {
    switch (role) {
      case 'owner':
      case 'manager':
        return {
          title: 'Tổng quan vận hành',
          subtitle: `Xin chào ${userName} (${roleTitle}) • Khu vực điều phối xưởng, theo dõi tiến độ và kiểm soát chất lượng dịch vụ.`,
          eyebrow: 'RepairFlow / Tổng quan',
          scopeNote:
            'Không gian làm việc: Điều phối vận hành dành cho Quản lý / Chủ cửa hàng. Các chỉ số KPI thời gian thực, cảnh báo đơn quá hạn SLA và phân công kỹ thuật viên sẽ được kết nối chính thức trong chặng C9 sau khi hoàn tất các nghiệp vụ thành phần (C2–C8).',
          icon: <IconOverview size={20} />,
        };
      case 'receptionist':
        return {
          title: 'Tổng quan hôm nay & Tra cứu tiến độ',
          subtitle: `Xin chào ${userName} (${roleTitle}) • Khu vực tiếp nhận thiết bị tại quầy và tra cứu thông tin hỗ trợ khách hàng.`,
          eyebrow: 'RepairFlow / Hôm nay',
          scopeNote:
            'Không gian làm việc: Tiếp nhận và tra cứu tiến độ dành cho Lễ tân. Cho phép tra cứu tiến độ toàn bộ phiếu sửa chữa trong cửa hàng ở chế độ chỉ xem (Read-only) để giải đáp khách hàng. Dữ liệu tiếp nhận và bàn giao sẽ được tích hợp trong C2 và C9.',
          icon: <IconInbox size={20} />,
        };
      case 'technician':
        return {
          title: 'Hàng chờ công việc (My Work)',
          subtitle: `Xin chào ${userName} (${roleTitle}) • Khu vực xử lý kỹ thuật, chẩn đoán lỗi và kiểm tra chất lượng thiết bị.`,
          eyebrow: 'RepairFlow / Hàng chờ công việc',
          scopeNote:
            'Không gian làm việc: Danh sách công việc được phân công cho Kỹ thuật viên (ưu tiên theo hạn cam kết SLA). Chức năng ghi nhận chẩn đoán, đề xuất báo giá, sửa chữa và kiểm tra chất lượng (QC) sẽ được tích hợp trong C6 và C9.',
          icon: <IconQueue size={20} />,
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="dashboard-placeholder-view">
      {/* Page Header */}
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        eyebrow={config.eyebrow}
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
          {config.icon}
        </span>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '13px', color: 'var(--rf-text-main, #0f172a)', marginBottom: '4px' }}>
            Ranh giới kiến trúc (Task C1-002 Application Shell)
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--rf-text-muted, #64748b)', lineHeight: 1.5 }}>
            {config.scopeNote}
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
              title="Chưa có dữ liệu ghi nhận"
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
        <>
          {/* Manager / Owner View Placeholder */}
          {(role === 'manager' || role === 'owner') && (
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
                  <CardPanelHeader title="Theo dõi tiến độ đơn sửa chữa" />
                  <CardPanelBody>
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                      <p style={{ margin: '0 0 12px' }}>
                        Khu vực hiển thị danh sách phiếu sửa chữa thực tế từ backend ASP.NET Core.
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                        [Placeholder C1-002: Không tạo dữ liệu giả lập C9]
                      </span>
                    </div>
                  </CardPanelBody>
                </CardPanel>

                <CardPanel>
                  <CardPanelHeader title="Phân bổ nhân sự & Bàn làm việc" />
                  <CardPanelBody>
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                      <p style={{ margin: '0 0 12px' }}>
                        Bảng phân bổ công việc theo năng lực xử lý của từng kỹ thuật viên.
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                        [Placeholder C1-002: Sẽ kết nối trong C1-006 / C9]
                      </span>
                    </div>
                  </CardPanelBody>
                </CardPanel>
              </div>
            </div>
          )}

          {/* Receptionist View Placeholder */}
          {role === 'receptionist' && (
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

              <CardPanel>
                <CardPanelHeader title="Tra cứu tiến độ toàn cửa hàng (Read-only)" />
                <CardPanelBody>
                  <div style={{ padding: '16px 0' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0 12px',
                          height: '38px',
                          borderRadius: 'var(--rf-radius-md, 8px)',
                          border: '1px solid var(--rf-border, #e2e8f0)',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <IconLookup size={16} style={{ color: 'var(--rf-text-muted, #64748b)' }} />
                        <input
                          type="text"
                          placeholder="Nhập mã phiếu, SĐT hoặc tên khách để tra cứu nhanh..."
                          style={{
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            fontSize: '13px',
                            color: 'var(--rf-text-main, #0f172a)',
                          }}
                          readOnly
                        />
                      </div>
                      <PrimaryButton disabled>Tra cứu</PrimaryButton>
                    </div>

                    <p style={{ margin: 0, textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                      Chức năng tra cứu tiến độ nhanh (Read-only lookup) cho phép Lễ tân xem trạng thái an toàn mà không có quyền sửa chữa hay thay đổi báo giá.
                    </p>
                  </div>
                </CardPanelBody>
              </CardPanel>
            </div>
          )}

          {/* Technician View Placeholder */}
          {role === 'technician' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="stat-grid">
                <StatCard
                  label="Việc cần làm ngay"
                  value="--"
                  sub="Ưu tiên SLA cao nhất"
                  icon={<IconQueue size={20} />}
                />
                <StatCard
                  label="Đang chẩn đoán"
                  value="--"
                  sub="Chờ kết nối C6"
                  icon={<IconOrders size={20} />}
                />
                <StatCard
                  label="Chờ kiểm tra chất lượng"
                  value="--"
                  sub="QC Check"
                  icon={<IconClock size={20} />}
                />
              </div>

              <CardPanel>
                <CardPanelHeader title="Hàng chờ công việc được phân công (My Work Queue)" />
                <CardPanelBody>
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 12px' }}>
                      Kỹ thuật viên chỉ xem và thao tác trên các phiếu sửa chữa được phân công trực tiếp.
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--rf-text-muted, #94a3b8)' }}>
                      [Placeholder C1-002: Chuẩn bị cho task C6 và C9]
                    </span>
                  </div>
                </CardPanelBody>
              </CardPanel>
            </div>
          )}
        </>
      )}
    </div>
  );
}
