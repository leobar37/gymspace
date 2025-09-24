# Dashboard Sales Widgets Enhancement

## Overview

Add new sales-oriented statistics widgets to the mobile app dashboard to provide comprehensive sales analytics and insights beyond the current basic revenue widget.

## Current State Analysis

### Dashboard Architecture
The dashboard currently uses:
- **Layout**: ScrollView with VStack, 2-column grid for widgets
- **Data Management**: Zustand store for date range + TanStack Query for data fetching
- **Widget Structure**: Consistent Card-based design with icon + title + metric + subtitle
- **Refresh**: Pull-to-refresh functionality with query invalidation
- **Loading States**: Individual widget loading with consistent error handling

### Existing Sales Widgets
Currently implemented:
- **SalesRevenueWidget**: Shows total revenue, sales count (blue theme, shopping cart icon)
- Location: Revenue section alongside ContractsRevenueWidget

### Available Data Sources
Rich sales analytics available via SDK:

1. **Dashboard Sales Revenue**: `sdk.dashboard.getSalesRevenue()`
   - Returns: totalRevenue, salesCount, averageRevenue

2. **Sales Statistics**: `sdk.sales.getSalesStats()`
   - Returns: totalSales, totalRevenue, paidSales, unpaidSales, paymentRate

3. **Top Selling Products**: `sdk.sales.getTopSellingProducts()`
   - Returns: product details, totalQuantity, totalRevenue per product

4. **Customer Sales Report**: `sdk.sales.getSalesByCustomer()`
   - Returns: customer purchase behavior, sales count per customer, revenue breakdown

5. **Sales Search**: `sdk.sales.searchSales()` with advanced filtering
   - Filters: date range, customer, payment status, amount range

## Requirements

### New Sales Widgets to Implement

#### 1. Sales Performance Widget
**Purpose**: Show payment success rate and unpaid sales monitoring
- **Data Source**: `sdk.sales.getSalesStats()`
- **Primary Metric**: Payment success rate percentage (from paymentRate field)
- **Secondary Metric**: Count of unpaid sales
- **Icon**: `CheckCircle` or `TrendingUp`
- **Color Theme**: Green (`bg-green-100` + `text-green-600`) for positive performance
- **Layout Position**: Add to existing Revenue section (3-widget row)

#### 2. Top Products Widget
**Purpose**: Display best performing products by revenue
- **Data Source**: `sdk.sales.getTopSellingProducts(limit: 3)`
- **Primary Metric**: Name of top-selling product
- **Secondary Metric**: Revenue amount from top product
- **Icon**: `Award` or `Package`
- **Color Theme**: Purple (`bg-purple-100` + `text-purple-600`)
- **Layout Position**: New "Product Performance" section
- **Drill-down**: BottomSheet showing top 10 products list

#### 3. Customer Insights Widget
**Purpose**: Show customer purchase behavior metrics
- **Data Source**: `sdk.sales.getSalesByCustomer()`
- **Primary Metric**: Total unique customers with purchases
- **Secondary Metric**: Average revenue per customer
- **Icon**: `Users` or `UserCheck`
- **Color Theme**: Teal (`bg-teal-100` + `text-teal-600`)
- **Layout Position**: New "Customer Performance" section

#### 4. Sales Trends Widget (Optional Enhancement)
**Purpose**: Compare current period performance to previous period
- **Data Source**: Two calls to `sdk.sales.getSalesStats()` with different date ranges
- **Primary Metric**: Percentage change in revenue vs previous period
- **Secondary Metric**: Direction indicator (up/down arrow)
- **Icon**: `TrendingUp` or `TrendingDown` based on trend
- **Color Theme**: Dynamic (green for positive, red for negative trends)
- **Layout Position**: Sales Analytics section

### Implementation Requirements

#### Widget Structure
Follow existing widget patterns:
```tsx
<Card className="bg-white p-4">
  <View className="flex-row items-center justify-between mb-2">
    <View className="flex-row items-center gap-2">
      <View className="bg-[color]-100 p-2 rounded-lg">
        <Icon size={20} className="text-[color]-600" />
      </View>
      <Text className="text-sm font-medium text-gray-600">{title}</Text>
    </View>
  </View>
  <Text className="text-2xl font-bold text-gray-900">{mainMetric}</Text>
  <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
</Card>
```

#### Hook Implementation
Create TanStack Query hooks following existing patterns:
- **Hook Location**: `packages/mobile/src/features/dashboard/hooks/useDashboardWidgets.ts`
- **Query Keys**: Add to `dashboardQueryKeys` object
- **Caching**: 3-minute stale time, 5-minute garbage collection
- **Date Integration**: Use date range from `useDashboardDateRangeManager()`

#### Component Organization
- **Widget Components**: Add to `packages/mobile/src/features/dashboard/components/widgets/`
- **Export Pattern**: Update `widgets/index.ts` with new widget exports
- **Main Integration**: Update `Dashboard.tsx` to include new widgets

### Layout Changes

#### Current Layout
```
Metrics Section (2-column)
├── CheckInsWidget
└── NewClientsWidget

Revenue Section (2-column)
├── ContractsRevenueWidget
└── SalesRevenueWidget

Full Width
└── DebtsWidget
```

#### Proposed Enhanced Layout
```
Metrics Section (2-column)
├── CheckInsWidget
└── NewClientsWidget

Revenue Section (3-column row)
├── ContractsRevenueWidget
├── SalesRevenueWidget
└── SalesPerformanceWidget

Product Performance Section (2-column)
├── TopProductsWidget
└── CustomerInsightsWidget

Full Width
└── DebtsWidget
```

### Data Flow Architecture

#### State Management
- **Date Range**: Continue using existing Zustand store (`dashboard.store.ts`)
- **Widget Data**: Individual TanStack Query hooks per widget
- **Caching Strategy**: Align with existing 3-minute stale time pattern
- **Refresh**: Integrate with existing pull-to-refresh mechanism

#### Error Handling
- **Pattern**: Individual widget error states (no cascading failures)
- **UI**: Red error text within widget card following existing pattern
- **Fallback**: Graceful degradation (show loading state on error)

#### Loading States
- **Pattern**: Individual widget loading with `<Spinner size="small" />` in fixed height container (`h-24`)
- **Progressive Loading**: Widgets load independently as data becomes available

### Technical Implementation Details

#### New Hook Functions Required
```typescript
// Add to useDashboardWidgets.ts
export const useSalesPerformanceWidget = () => {
  // Uses sdk.sales.getSalesStats() with date range
}

export const useTopProductsWidget = () => {
  // Uses sdk.sales.getTopSellingProducts() with date range
}

export const useCustomerInsightsWidget = () => {
  // Uses sdk.sales.getSalesByCustomer() with date range
}
```

#### Widget Component Files Required
- `SalesPerformanceWidget.tsx` - Payment success rate and unpaid tracking
- `TopProductsWidget.tsx` - Best performing products
- `CustomerInsightsWidget.tsx` - Customer purchase behavior

#### Dashboard Integration
- Update `Dashboard.tsx` to include new widget sections
- Maintain existing scroll and refresh functionality
- Add appropriate section headers for new widget groups

### UI/UX Considerations

#### Mobile Optimization
- **Touch Targets**: Maintain existing touch-friendly sizing
- **Spacing**: Follow existing gap patterns (`gap-3` for widgets, `gap-4` for sections)
- **Readability**: Use established typography scale for consistency

#### Visual Consistency
- **Color Coding**: Each widget type maintains unique color for quick identification
- **Icon Selection**: Use Lucide React Native icons following existing patterns
- **Loading States**: Consistent spinner placement and sizing

#### Enhanced Interactivity (Future Enhancement)
- **Drill-down Views**: Use BottomSheet component for detailed analytics
- **Action Sheets**: Quick actions for widget data (export, view details)
- **Navigation**: Tap widgets to navigate to detailed sales screens

### Data Requirements

#### API Integration
All required endpoints are available in SDK:
- `dashboard.getSalesRevenue()` - Already implemented
- `sales.getSalesStats()` - Payment performance data
- `sales.getTopSellingProducts()` - Product performance
- `sales.getSalesByCustomer()` - Customer insights

#### Date Range Support
All analytics endpoints support date range filtering compatible with existing dashboard date selector.

#### Performance Optimization
- **Caching**: Leverage existing TanStack Query caching strategy
- **Prefetching**: Integrate with existing `DataPrefetch` component
- **Parallel Loading**: Widgets load independently for better perceived performance

### Success Criteria

#### Functional Requirements
1. New sales widgets display accurate data from SDK endpoints
2. Widgets integrate seamlessly with existing date range selector
3. Pull-to-refresh updates all new widgets correctly
4. Loading and error states function consistently with existing widgets
5. Data updates in real-time when date range changes

#### Non-Functional Requirements
1. Performance: Widget loading times under 2 seconds on 3G connection
2. Visual Consistency: New widgets match existing design patterns exactly
3. Mobile UX: Touch interactions work smoothly on all device sizes
4. Accessibility: Proper color contrast and touch target sizing

### Implementation Priority

#### Phase 1 (Core Enhancement)
1. **SalesPerformanceWidget** - Payment success rate tracking
2. **TopProductsWidget** - Product performance insights
3. **Dashboard Layout Updates** - Integrate widgets into existing layout

#### Phase 2 (Customer Insights)
1. **CustomerInsightsWidget** - Customer behavior analytics
2. **Enhanced Layout** - Customer Performance section

#### Phase 3 (Advanced Features - Future)
1. **SalesTrendsWidget** - Period-over-period comparisons
2. **Drill-down Views** - BottomSheet detailed analytics
3. **Export Functionality** - Data export capabilities

## Technical Dependencies

### Required Components
- Existing UI components: `Card`, `Text`, `View`, `Spinner`
- Icons: Lucide React Native (`CheckCircle`, `Award`, `Users`, `TrendingUp`)
- Layout: Existing flex layout patterns

### Required Services
- SDK sales resource methods (all available)
- TanStack Query for data fetching (configured)
- Zustand store for date range management (existing)

### No Additional Dependencies
Implementation uses existing technology stack - no new libraries required.