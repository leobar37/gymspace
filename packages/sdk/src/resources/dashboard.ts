import { BaseResource } from './base';
import { DashboardStats, RecentActivity, ExpiringContract } from '../models/dashboard';

export class DashboardResource extends BaseResource {
  /**
   * Get dashboard statistics
   * @returns Dashboard statistics including clients, contracts, revenue, and check-ins
   */
  async getStats(): Promise<DashboardStats> {
    return this.client.get<DashboardStats>('/dashboard/stats');
  }

  /**
   * Get recent activity
   * @param limit Maximum number of activities to return (default: 10)
   * @returns List of recent activities in the gym
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    return this.client.get<RecentActivity[]>('/dashboard/recent-activity', { limit });
  }

  /**
   * Get expiring contracts
   * @param limit Maximum number of contracts to return (default: 10)
   * @returns List of contracts expiring in the next 30 days
   */
  async getExpiringContracts(limit: number = 10): Promise<ExpiringContract[]> {
    return this.client.get<ExpiringContract[]>('/dashboard/expiring-contracts', { limit });
  }
}