import { BaseResource } from './base';
import {
  DashboardStats,
  ExpiringContract,
  ContractsRevenue,
  SalesRevenue,
  Debts,
  CheckIns,
  NewClients,
  DateRangeParams,
} from '../models/dashboard';

export class DashboardResource extends BaseResource {
  /**
   * Get dashboard statistics (lightweight counts only)
   * @returns Dashboard statistics including client and contract counts
   */
  async getStats(): Promise<DashboardStats> {
    return this.client.get<DashboardStats>('/dashboard/stats');
  }

  /**
   * Get contracts revenue within date range
   * @param params Optional date range parameters
   * @returns Contracts revenue data for the specified period
   */
  async getContractsRevenue(params?: DateRangeParams): Promise<ContractsRevenue> {
    return this.client.get<ContractsRevenue>('/dashboard/contracts-revenue', params);
  }

  /**
   * Get sales revenue within date range
   * @param params Optional date range parameters
   * @returns Sales revenue data for the specified period
   */
  async getSalesRevenue(params?: DateRangeParams): Promise<SalesRevenue> {
    return this.client.get<SalesRevenue>('/dashboard/sales-revenue', params);
  }

  /**
   * Get total debts within date range
   * @param params Optional date range parameters
   * @returns Outstanding debts data for the specified period
   */
  async getDebts(params?: DateRangeParams): Promise<Debts> {
    return this.client.get<Debts>('/dashboard/debts', params);
  }

  /**
   * Get check-ins count within date range
   * @param params Optional date range parameters
   * @returns Check-ins data for the specified period
   */
  async getCheckIns(params?: DateRangeParams): Promise<CheckIns> {
    return this.client.get<CheckIns>('/dashboard/check-ins', params);
  }

  /**
   * Get new clients count within date range
   * @param params Optional date range parameters
   * @returns New clients data for the specified period
   */
  async getNewClients(params?: DateRangeParams): Promise<NewClients> {
    return this.client.get<NewClients>('/dashboard/new-clients', params);
  }

  /**
   * Get expiring contracts within date range
   * @param limit Maximum number of contracts to return (default: 10)
   * @param params Optional date range parameters
   * @returns List of contracts expiring in the specified period
   */
  async getExpiringContracts(
    limit: number = 10,
    params?: DateRangeParams,
  ): Promise<ExpiringContract[]> {
    return this.client.get<ExpiringContract[]>('/dashboard/expiring-contracts', {
      limit,
      ...params,
    });
  }
}