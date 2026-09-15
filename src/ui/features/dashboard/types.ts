export type DashboardFilterKey =
  | 'all'
  | 'overdue'
  | 'waiting_approval'
  | 'unassigned'
  | 'qc_rework'
  | 'ready_handover';

export type DashboardViewState = 'ready' | 'loading' | 'empty' | 'error' | 'stale';

export interface DashboardMetric {
  id: string;
  label: string;
  count: number;
  priorityText: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  filterKey: DashboardFilterKey;
}

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  tone: 'blue' | 'cyan' | 'violet' | 'purple' | 'emerald';
  filterKey?: DashboardFilterKey;
}

export interface InterventionOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  issueSummary: string;
  waitingParty: 'Khách hàng' | 'Kỹ thuật viên' | 'Quản lý' | 'Lễ tân';
  slaStatus: 'overdue' | 'warning' | 'normal';
  slaText: string;
  assignedStaffName: string | null;
  assignedStaffId?: string;
  statusText: string;
  statusTone: 'waiting' | 'draft' | 'rework' | 'repairing' | 'ready' | 'qc' | 'overdue';
  priority: 'urgent' | 'high' | 'normal';
  priorityLabel: string;
  nextActionText: string;
  nextActionTone?: 'primary' | 'secondary' | 'warning';
  filterTags: DashboardFilterKey[];

  // Drill-down detail fields
  intakeDate?: string;
  expectedCompletionDate?: string;
  accessories?: string;
  intakeNotes?: string;
  diagnosisCause?: string;
  diagnosisSolution?: string;
  quoteTotal?: number;
  quoteVersion?: number;
  timeline?: Array<{
    time: string;
    actor: string;
    action: string;
  }>;
}

export interface OperationalAlert {
  id: string;
  title: string;
  count: number;
  description: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  filterKey: DashboardFilterKey;
  actionText: string;
}

export interface StaffWorkloadItem {
  id: string;
  name: string;
  roleTitle: string;
  specialty: string;
  activeOrders: number;
  maxCapacity: number;
  overdueOrders: number;
  waitingQcOrders: number;
  loadPercentage: number;
  loadStatus: 'normal' | 'high' | 'full' | 'available';
  statusText: string;
}

export interface DashboardViewModel {
  storeName: string;
  lastRefreshedAt: string;
  metrics: DashboardMetric[];
  pipeline: PipelineStage[];
  interventionOrders: InterventionOrder[];
  alerts: OperationalAlert[];
  workload: StaffWorkloadItem[];
  availableStaffCount: number;
}
