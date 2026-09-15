import { demoMetrics, demoOrders, demoPipeline } from '../../mocks/demo-shell';
import {
  OrderCode,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TextButton,
  IconButton,
} from '../../shared/components';

export function ManagerDashboardView() {
  return (
    <div className="view-container">
      {/* Page Heading */}
      <section className="page-heading">
        <div>
          <span className="eyebrow">Thứ Tư, 16 tháng 9, 2026 • Trung tâm điều hành</span>
          <h1>Chào buổi sáng, Quản lý Minh Tâm <span aria-hidden="true">👋</span></h1>
          <p>Tình hình vận hành và phân bổ luồng việc cửa hàng hôm nay.</p>
        </div>
        <PrimaryButton>
          <span aria-hidden="true">＋</span> Tạo phiếu mới
        </PrimaryButton>
      </section>

      {/* Metrics Row - Single Flat Strip with subtle dividers (No box-in-box) */}
      <section className="metric-strip" aria-label="Chỉ số vận hành">
        {demoMetrics.map((metric, idx) => (
          <div key={metric.label} className="metric-strip__item">
            <span className="metric-label">{metric.label}</span>
            <div className="metric-value-row">
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-hint">{metric.hint}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Structured Content Grid */}
      <section className="content-grid">
        {/* Pipeline Progression */}
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Theo dõi luồng việc</span>
              <h2>Tiến độ phiếu sửa chữa</h2>
            </div>
            <TextButton>Xem tất cả <span aria-hidden="true">→</span></TextButton>
          </div>
          <div className="pipeline-list">
            {demoPipeline.map((step) => (
              <div className="pipeline-step" key={step.label}>
                <div className={`pipeline-step__marker pipeline-step__marker--${step.tone}`}>
                  {step.count}
                </div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="pipeline-progress"><span /></div>
          <div className="pipeline-footer">
            <span>38 phiếu trong luồng</span>
            <span>Cập nhật vừa xong</span>
          </div>
        </article>

        {/* Workload Capacity */}
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Phân bổ công việc</span>
              <h2>Tải của đội ngũ</h2>
            </div>
            <IconButton label="Tùy chọn tải công việc">⋯</IconButton>
          </div>
          <div className="workload-summary">
            <strong>78%</strong>
            <span>công suất đang sử dụng</span>
          </div>
          <div className="workload-bar"><span /></div>
          <div className="workload-legend">
            <span><i className="legend-dot legend-dot--blue" /> Đang xử lý <strong>28</strong></span>
            <span><i className="legend-dot legend-dot--gray" /> Còn trống <strong>8</strong></span>
          </div>
          <p className="muted-copy">Cửa hàng còn đủ năng lực tiếp nhận khoảng 8 thiết bị mới trong hôm nay.</p>
        </article>
      </section>

      {/* Priority Watchlist Table */}
      <section className="panel orders-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Cần chú ý</span>
            <h2>Phiếu cần theo dõi xử lý</h2>
          </div>
          <SecondaryButton>Mở danh sách phiếu đầy đủ</SecondaryButton>
        </div>
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Thiết bị</th>
                <th>Trạng thái hiện tại</th>
                <th>Cập nhật gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {demoOrders.map((order) => (
                <tr key={order.id}>
                  <td><OrderCode code={order.id} /></td>
                  <td><strong className="customer-name">{order.customer}</strong></td>
                  <td>{order.device}</td>
                  <td><StatusBadge label={order.status} tone={order.tone} /></td>
                  <td className="muted-cell">{order.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
