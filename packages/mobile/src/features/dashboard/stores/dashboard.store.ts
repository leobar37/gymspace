import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DashboardState {
  // Date range for all dashboard data
  dateRange: DateRange;
  
  // Actions
  setDateRange: (startDate: Date, endDate: Date) => void;
  resetDateRange: () => void;
}

// Helper function to get default date range (current month)
const getDefaultDateRange = (): DateRange => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate, endDate };
};

export const useDashboardStore = create<DashboardState>()(
  immer((set) => ({
    dateRange: getDefaultDateRange(),
    
    setDateRange: (startDate: Date, endDate: Date) =>
      set((state) => {
        state.dateRange = { startDate, endDate };
      }),
    
    resetDateRange: () =>
      set((state) => {
        state.dateRange = getDefaultDateRange();
      }),
  }))
);

// Selector hooks
export const useDashboardDateRange = () => useDashboardStore((state) => state.dateRange);
export const useSetDashboardDateRange = () => useDashboardStore((state) => state.setDateRange);
export const useResetDashboardDateRange = () => useDashboardStore((state) => state.resetDateRange);