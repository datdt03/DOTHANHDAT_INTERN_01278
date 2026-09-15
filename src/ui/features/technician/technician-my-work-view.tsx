import { useState } from 'react';
import {
  OrderCode,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from '../../shared/components';

interface TechnicianTask {
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
  primaryActionLabel: string;
}

const DEMO_TASKS: TechnicianTask[] = [
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
    primaryActionLabel: 'Tiếp tục sửa chữa',
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
    primaryActionLabel: 'Bắt đầu chẩn đoán',
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
    primaryActionLabel: 'Thực hiện kiểm tra QC',
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
    primaryActionLabel: 'Cập nhật tình trạng',
  },
];

export function TechnicianMyWorkView() {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'diagnose' | 'repair' | 'qc'>('all');

  const filteredTasks = DEMO_TASKS.filter((task) => {
    if (filter === 'urgent') return task.isUrgent;
    if (filter === 'diagnose') return task.stage === 'diagnose';
    if (filter === 'repair') return task.stage === 'repair';
    if (filter === 'qc') return task.stage === 'qc';
    return true;
  });

  return (
    <div className="view-container">
      {/* Page Heading */}
      <section className="page-heading">
        <div>
          <span className="eyebrow">Kỹ thuật viên • Hàng chờ công việc cá nhân</span>
          <h1>My Work — Công việc được phân công</h1>
          <p>Danh sách thiết bị sắp xếp theo thứ tự ưu tiên hạn xử lý (SLA).</p>
        </div>
        <div className="sla-summary-pill">
          <span className="online-dot" />
          <span>4 việc đang phụ trách • <strong>1 việc cận hạn SLA</strong></span>
        </div>
      </section>

      {/* Filter Toolbar - Clean Pills */}
      <div className="task-filters">
        <button
          type="button"
          className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả (4)
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'urgent' ? 'filter-btn--active' : ''}`}
          onClick={() => setFilter('urgent')}
        >
          🚨 Cận hạn SLA (1)
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'diagnose' ? 'filter-btn--active' : ''}`}
          onClick={() => setFilter('diagnose')}
        >
          Cần chẩn đoán (1)
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'repair' ? 'filter-btn--active' : ''}`}
          onClick={() => setFilter('repair')}
        >
          Đang sửa (2)
        </button>
        <button
          type="button"
          className={`filter-btn ${filter === 'qc' ? 'filter-btn--active' : ''}`}
          onClick={() => setFilter('qc')}
        >
          Cần QC (1)
        </button>
      </div>

      {/* Priority Work Queue - Structured Table Rows (No box-in-box) */}
      <section className="panel work-queue-panel">
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Thiết bị & Khách hàng</th>
                <th>Mô tả lỗi tiếp nhận</th>
                <th>Trạng thái</th>
                <th>Hạn SLA</th>
                <th style={{ textAlign: 'right' }}>Hành động tiếp theo</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className={task.isUrgent ? 'row-urgent' : ''}>
                  <td>
                    <OrderCode code={task.id} />
                    {task.isUrgent && (
                      <span className="urgent-tag" title="Sắp quá hạn xử lý">
                        CẬN HẠN
                      </span>
                    )}
                  </td>
                  <td>
                    <strong className="device-name">{task.device}</strong>
                    <span className="customer-sub">{task.customer}</span>
                  </td>
                  <td>
                    <p className="task-issue">{task.issue}</p>
                    {task.blockedReason && (
                      <span className="blocked-hint">⚠ {task.blockedReason}</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge label={task.statusLabel} tone={task.statusTone} />
                  </td>
                  <td>
                    <span className={`sla-deadline ${task.isUrgent ? 'sla-deadline--urgent' : ''}`}>
                      {task.slaDeadline}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <PrimaryButton className="task-action-btn">
                      {task.primaryActionLabel} →
                    </PrimaryButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
