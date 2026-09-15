/**
 * RepairFlow - UI Configuration & Constants
 */

export const UI_CONFIG = {
  appName: 'RepairFlow',
  shopName: 'Minh Tâm Store',
  shopAddress: '182 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
  shopPhone: '1900 8899',
  shopStatus: 'Store is open',
  currentUser: {
    name: 'Minh Tâm',
    role: 'Operations Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
  }
};

export const STATUS_LABELS = {
  received: { label: 'New intake', color: 'blue', step: 1 },
  diagnosing: { label: 'Diagnosing', color: 'sky', step: 2 },
  waiting_for_approval: { label: 'Waiting for customer approval', color: 'amber', step: 3 },
  approved: { label: 'Quotation approved', color: 'indigo', step: 3 },
  repairing: { label: 'Repairing', color: 'purple', step: 4 },
  quality_check: { label: 'Quality check', color: 'teal', step: 5 },
  ready_for_pickup: { label: 'Ready for Handover', color: 'emerald', step: 6 },
  handed_over: { label: 'Handed over', color: 'green', step: 6 },
  rejected: { label: 'Customer rejected', color: 'rose', step: 3 },
  overdue: { label: 'Overdue', color: 'red', step: 4 }
};

export const PIPELINE_STEPS = [
  { step: 1, title: 'Intake', subtext: 'Awaiting assignment' },
  { step: 2, title: 'Diagnosis', subtext: 'Testing' },
  { step: 3, title: 'Quote approval', subtext: '11.4 tr' },
  { step: 4, title: 'Repair', subtext: 'At repair bench' },
  { step: 5, title: 'Quality check', subtext: 'Functional test...' },
  { step: 6, title: 'Ready...', subtext: 'Pickup scheduled' }
];

