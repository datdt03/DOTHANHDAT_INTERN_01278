import { useState } from 'react';
import {
  PageHeader,
  StatCard,
  CardPanel,
  CardPanelHeader,
  CardPanelBody,
  CardPanelFooter,
  DataTable,
  FormGroup,
  FormInput,
  FormSelect,
  Alert,
  Modal,
  ProgressStepper,
  EmptyState,
  StatusBadge,
  OrderCode,
  SkeletonLoader,
  PrimaryButton,
  SecondaryButton,
} from '../../shared/components';

interface SampleRow {
  id: string;
  code: string;
  customer: string;
  device: string;
  technician: string;
  status: 'draft' | 'diagnosing' | 'waiting' | 'repairing' | 'qc' | 'ready' | 'completed' | 'rework';
  statusLabel: string;
  amount: string;
  sla: string;
  slaUrgent?: boolean;
}

const sampleOrders: SampleRow[] = [
  {
    id: '1',
    code: 'ORD-2026-0301',
    customer: 'Trần Văn Cường (0912***456)',
    device: 'iPhone 13 Pro Max - Thay pin pin chai 74%',
    technician: 'Quốc Bảo',
    status: 'repairing',
    statusLabel: 'Đang sửa chữa',
    amount: '1.200.000 đ',
    sla: 'Còn 45 phút',
    slaUrgent: true,
  },
  {
    id: '2',
    code: 'ORD-2026-0302',
    customer: 'Lê Hoàng Yến (0988***112)',
    device: 'MacBook Air M1 - Kẹt phím Spacebar',
    technician: 'Văn Toàn',
    status: 'waiting',
    statusLabel: 'Chờ khách duyệt',
    amount: '850.000 đ',
    sla: 'Hạn 17:00 hôm nay',
  },
  {
    id: '3',
    code: 'ORD-2026-0303',
    customer: 'Nguyễn Anh Tuấn (0905***789)',
    device: 'Dell XPS 13 9310 - Mất nguồn sạc',
    technician: 'Quốc Bảo',
    status: 'qc',
    statusLabel: 'Kiểm tra chất lượng',
    amount: '1.800.000 đ',
    sla: 'Còn 2 giờ',
  },
  {
    id: '4',
    code: 'ORD-2026-0304',
    customer: 'Phạm Hồng Nhung (0977***654)',
    device: 'iPad Pro 11 inch - Ép kính màn hình nứt',
    technician: 'Thu Hà (TN)',
    status: 'draft',
    statusLabel: 'Tiếp nhận mới',
    amount: 'Chờ báo giá',
    sla: 'Còn 3 giờ',
  },
];

const flowSteps = [
  { key: 'reception', label: '1. Tiếp nhận' },
  { key: 'diagnose', label: '2. Chẩn đoán' },
  { key: 'quote', label: '3. Khách duyệt giá' },
  { key: 'repair', label: '4. Sửa chữa' },
  { key: 'qc', label: '5. Kiểm tra QC' },
  { key: 'ready', label: '6. Bàn giao' },
];

export function ComponentShowcaseView() {
  const [currentStep, setCurrentStep] = useState(3);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedService, setSelectedService] = useState('all');

  const filteredOrders = sampleOrders.filter((order) => {
    const matchText =
      order.code.toLowerCase().includes(filterText.toLowerCase()) ||
      order.customer.toLowerCase().includes(filterText.toLowerCase()) ||
      order.device.toLowerCase().includes(filterText.toLowerCase());
    return matchText;
  });

  const columns = [
    {
      key: 'code',
      header: 'Mã đơn',
      render: (row: SampleRow) => <OrderCode code={row.code} />,
      width: '140px',
    },
    {
      key: 'customer',
      header: 'Khách hàng & Thiết bị',
      render: (row: SampleRow) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--rf-text-main)' }}>{row.customer}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--rf-text-muted)', marginTop: '2px' }}>
            {row.device}
          </div>
        </div>
      ),
    },
    {
      key: 'technician',
      header: 'Phụ trách',
      width: '120px',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '160px',
      render: (row: SampleRow) => (
        <StatusBadge status={row.status} label={row.statusLabel} />
      ),
    },
    {
      key: 'sla',
      header: 'Cam kết SLA',
      width: '140px',
      render: (row: SampleRow) => (
        <span
          className={row.slaUrgent ? 'sla-deadline sla-deadline--urgent' : 'sla-deadline'}
        >
          {row.sla}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Chi phí dự kiến',
      align: 'right' as const,
      width: '130px',
      render: (row: SampleRow) => (
        <span style={{ fontWeight: 700, color: 'var(--rf-text-main)' }}>{row.amount}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right' as const,
      width: '100px',
      render: () => (
        <SecondaryButton
          className="task-action-btn"
          onClick={() => setIsModalOpen(true)}
        >
          Chi tiết
        </SecondaryButton>
      ),
    },
  ];

  return (
    <div className="view-container">
      {/* Page Header */}
      <PageHeader
        eyebrow="Hệ thống Thiết kế & Thư viện Component"
        title="RepairFlow UI Component Showcase"
        subtitle="Bộ linh kiện giao diện chuẩn hoá phong cách Admin tối giản (SB Admin 2), tỷ lệ 85% Slate / 15% Sky, đàn hồi khi zoom 110% - 150%."
        actions={
          <>
            <SecondaryButton onClick={() => window.print()}>
              In tài liệu UI
            </SecondaryButton>
            <PrimaryButton onClick={() => setIsModalOpen(true)}>
              Mở Modal Demo
            </PrimaryButton>
          </>
        }
      />

      {/* Zoom Resilience Notice Banner */}
      <Alert
        variant="info"
        title="Tiêu chuẩn hiển thị & Độ đàn hồi Zoom (Zoom Resilience Guide)"
        className="mb-4"
      >
        <p style={{ margin: '4px 0 6px' }}>
          Giao diện được căn chỉnh tỉ mỉ với <strong>mức phóng to 110% làm tiêu chuẩn nhìn</strong>.
          Khi người dùng hoặc hệ điều hành đặt tỷ lệ hiển thị ở <strong>125% hoặc 150%</strong> (hoặc nhấn <code>Ctrl + '+' / '-'</code>), toàn bộ layout tự động thích ứng:
        </p>
        <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '12px' }}>
          <li>
            <strong>Thẻ chỉ số (Stat Cards):</strong> Sử dụng CSS Grid tự động reflow từ 4 cột sang 3 hoặc 2 cột mượt mà, không bị tràn màn hình.
          </li>
          <li>
            <strong>Bảng dữ liệu (Data Table):</strong> Tự động cuộn ngang trơn tru bên trong khung container (<code>rf-table-responsive</code>) mà không làm vỡ bố cục body chính.
          </li>
          <li>
            <strong>Kích thước chữ (Typography):</strong> Sử dụng hàm <code>clamp()</code> và đơn vị <code>rem</code> đảm bảo độ đọc rõ nét, không bị chồng chéo.
          </li>
        </ul>
      </Alert>

      {/* SECTION 1: Stat Cards Grid */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rf-text-main)' }}>
          1. Thẻ Chỉ số Thống kê (Stat Cards - SB Admin 2 Border-Accent Style)
        </h2>
        <div className="rf-grid-stats">
          <StatCard
            variant="primary"
            label="Tổng tiếp nhận hôm nay"
            value="18 đơn"
            sub="↑ Tăng 12% so với hôm qua"
            icon="📋"
          />
          <StatCard
            variant="warning"
            label="Chờ khách duyệt giá"
            value="05 đơn"
            sub="Ưu tiên gọi điện chốt"
            icon="⏳"
          />
          <StatCard
            variant="danger"
            label="Cảnh báo SLA (< 1h)"
            value="02 đơn"
            sub="Cần bàn giao trước 17:30"
            icon="⚡"
          />
          <StatCard
            variant="success"
            label="Sẵn sàng trả khách"
            value="09 máy"
            sub="Doanh thu tạm tính: 14.8M"
            icon="✅"
          />
        </div>
      </section>

      {/* SECTION 2: Interactive Stepper */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rf-text-main)' }}>
          2. Thanh Tiến trình Sửa chữa (Progress Stepper)
        </h2>
        <CardPanel>
          <CardPanelHeader
            title="Quy trình 6 bước chuẩn RepairFlow v0"
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <SecondaryButton
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                >
                  ← Bước trước
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => setCurrentStep((s) => Math.min(flowSteps.length - 1, s + 1))}
                  disabled={currentStep === flowSteps.length - 1}
                >
                  Bước tiếp theo →
                </PrimaryButton>
              </div>
            }
          />
          <CardPanelBody>
            <ProgressStepper steps={flowSteps} currentStepIndex={currentStep} />
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12.5px', color: 'var(--rf-text-muted)' }}>
              Đang ở bước: <strong style={{ color: 'var(--rf-primary)' }}>{flowSteps[currentStep].label}</strong>
            </div>
          </CardPanelBody>
        </CardPanel>
      </section>

      {/* SECTION 3: Card Panels & Data Tables */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rf-text-main)' }}>
          3. Khung Panel & Bảng Dữ liệu Responsive (Card Panels & Tables)
        </h2>
        <CardPanel>
          <CardPanelHeader
            title={`Danh sách phiếu sửa chữa đang xử lý (${filteredOrders.length})`}
            actions={
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '220px' }}>
                  <FormInput
                    placeholder="Tìm mã, khách, thiết bị..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                <FormSelect
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  style={{ width: '150px' }}
                >
                  <option value="all">Tất cả dịch vụ</option>
                  <option value="hardware">Sửa phần cứng</option>
                  <option value="screen">Thay màn hình</option>
                  <option value="battery">Thay pin</option>
                </FormSelect>
              </div>
            }
          />
          <CardPanelBody flush>
            <DataTable
              columns={columns}
              data={filteredOrders}
              keyExtractor={(row) => row.id}
              emptyMessage="Không tìm thấy phiếu sửa chữa phù hợp với từ khóa lọc."
            />
          </CardPanelBody>
          <CardPanelFooter>
            <span>Hiển thị {filteredOrders.length} trên tổng số {sampleOrders.length} phiếu</span>
            <span>Dữ liệu mẫu cập nhật trực tiếp tại bộ nhớ cục bộ</span>
          </CardPanelFooter>
        </CardPanel>
      </section>

      {/* SECTION 4: Status Badges Matrix */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rf-text-main)' }}>
          4. Bảng Quy chuẩn Huy hiệu Trạng thái (Status Badges - Tối đa 1 điểm nhấn màu, pastel dịu mắt)
        </h2>
        <CardPanel>
          <CardPanelBody>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '14px',
                alignItems: 'center',
              }}
            >
              <div>
                <StatusBadge status="draft" label="1. draft / Tiếp nhận" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Mới tạo phiếu nháp</div>
              </div>
              <div>
                <StatusBadge status="diagnosing" label="2. diagnosing / Chẩn đoán" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Kỹ thuật viên đang kiểm tra</div>
              </div>
              <div>
                <StatusBadge status="waiting" label="3. waiting / Chờ duyệt" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Chờ khách xác nhận báo giá</div>
              </div>
              <div>
                <StatusBadge status="repairing" label="4. repairing / Sửa chữa" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Đang thực hiện sửa</div>
              </div>
              <div>
                <StatusBadge status="qc" label="5. qc / Kiểm định" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Kiểm tra chức năng & sạc</div>
              </div>
              <div>
                <StatusBadge status="ready" label="6. ready / Sẵn sàng" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Đã test xong, chờ khách lấy</div>
              </div>
              <div>
                <StatusBadge status="completed" label="7. completed / Hoàn tất" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Đã bàn giao và thu tiền</div>
              </div>
              <div>
                <StatusBadge status="rework" label="8. rework / Sửa lại" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>QC phát hiện lỗi phát sinh</div>
              </div>
              <div>
                <StatusBadge status="cancelled" label="9. cancelled / Huỷ đơn" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Khách từ chối sửa/không linh kiện</div>
              </div>
              <div>
                <StatusBadge status="overdue" label="10. overdue / Quá hạn SLA" />
                <div style={{ fontSize: '11px', color: 'var(--rf-text-subtle)', marginTop: '4px' }}>Hiệu ứng nhấp nháy báo động</div>
              </div>
            </div>
          </CardPanelBody>
        </CardPanel>
      </section>

      {/* SECTION 5: Form Controls, Alerts & Modals */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rf-text-main)' }}>
          5. Biểu mẫu & Băng thông báo (Form Controls & Alert Banners)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Column 1: Forms */}
          <CardPanel>
            <CardPanelHeader title="Biểu mẫu chuẩn hóa" />
            <CardPanelBody>
              <FormGroup label="Tên khách hàng" htmlFor="customer-name" hint="Nhập họ và tên đầy đủ theo giấy tờ">
                <FormInput id="customer-name" placeholder="Ví dụ: Nguyễn Văn An" />
              </FormGroup>

              <FormGroup label="Số điện thoại liên hệ" htmlFor="customer-phone">
                <FormInput id="customer-phone" placeholder="09xx xxx xxx" icon="📞" />
              </FormGroup>

              <FormGroup label="Tình trạng linh kiện" htmlFor="part-status" error="Linh kiện đang tạm hết hàng tại kho quận 1">
                <FormSelect id="part-status">
                  <option>Màn hình OLED Zin (Còn hàng tại kho tổng)</option>
                  <option>Màn hình Linh kiện cao cấp (Hết hàng)</option>
                </FormSelect>
              </FormGroup>
            </CardPanelBody>
          </CardPanel>

          {/* Column 2: Alerts & Skeleton */}
          <CardPanel>
            <CardPanelHeader title="Thông báo & Trạng thái tải (Alerts & Skeleton)" />
            <CardPanelBody>
              <Alert variant="success" dismissible title="Thao tác thành công">
                Đã lưu biên nhận sửa chữa và gửi SMS mã tra cứu đến khách hàng.
              </Alert>

              <Alert variant="warning" dismissible title="Cảnh báo linh kiện">
                Pin iPhone 13 Pro còn 2 quả trong kho. Đề xuất nhập thêm trước cuối tuần.
              </Alert>

              <Alert variant="danger" dismissible title="Cảnh báo SLA nghiêm trọng">
                Đơn ORD-2026-0301 đã chạm ngưỡng 90% thời gian cam kết!
              </Alert>

              <div style={{ marginTop: '16px' }}>
                <span className="info-label">Trạng thái nạp trước (Skeleton Loading)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <SkeletonLoader height="18px" width="70%" />
                  <SkeletonLoader height="14px" width="100%" />
                  <SkeletonLoader height="14px" width="85%" />
                </div>
              </div>
            </CardPanelBody>
          </CardPanel>
        </div>
      </section>

      {/* SECTION 6: Empty State Showcase */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rf-text-main)' }}>
          6. Trạng thái Trống (Empty State)
        </h2>
        <CardPanel>
          <CardPanelBody>
            <EmptyState
              icon="🔍"
              title="Không tìm thấy thiết bị cần tra cứu"
              description="Hãy kiểm tra lại số điện thoại hoặc mã biên nhận (VD: ORD-2026-xxxx) đã nhập."
              action={
                <PrimaryButton onClick={() => setFilterText('')}>
                  Xóa bộ lọc & Xem tất cả
                </PrimaryButton>
              }
            />
          </CardPanelBody>
        </CardPanel>
      </section>

      {/* Interactive Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        title="Xác nhận Chuyển trạng thái Đơn hàng"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <SecondaryButton onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </SecondaryButton>
            <PrimaryButton
              onClick={() => {
                alert('Đã xác nhận chuyển bước thành công!');
                setIsModalOpen(false);
              }}
            >
              Xác nhận duyệt
            </PrimaryButton>
          </>
        }
      >
        <p style={{ margin: '0 0 12px' }}>
          Bạn đang thực hiện chuyển đơn hàng <strong>ORD-2026-0301</strong> sang giai đoạn{' '}
          <strong style={{ color: 'var(--rf-primary)' }}>Kiểm tra chất lượng (QC)</strong>.
        </p>
        <div className="customer-safe-box">
          <strong>Lưu ý kỹ thuật:</strong> Thiết bị đã được kỹ thuật viên Quốc Bảo thay pin và dán lại keo chống nước. Hãy thực hiện kiểm tra sạc đầy 100% trước khi bàn giao cho quầy tiếp tân.
        </div>
      </Modal>
    </div>
  );
}
