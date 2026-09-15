import type { DashboardViewModel } from '../../features/dashboard/types';
import { mockDashboardData, emptyDashboardMockData } from '../../mocks/dashboard-mock-data';
import { ApiClientError } from './api-client';

export interface DashboardApi {
  getDashboardOverview(options?: {
    forceEmpty?: boolean;
    simulateError?: boolean;
    delayMs?: number;
  }): Promise<DashboardViewModel>;
}

class DashboardApiAdapter implements DashboardApi {
  async getDashboardOverview(options: {
    forceEmpty?: boolean;
    simulateError?: boolean;
    delayMs?: number;
  } = {}): Promise<DashboardViewModel> {
    const delay = options.delayMs ?? 150;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (options.simulateError) {
      throw new ApiClientError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.', 503);
    }

    if (options.forceEmpty) {
      return emptyDashboardMockData;
    }

    return mockDashboardData;
  }
}

export const dashboardApi: DashboardApi = new DashboardApiAdapter();
