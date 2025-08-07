# Inventory and Point of Sale - Implementation Prompts

## Prompt 1: Database and Models Setup

Create a complete database schema for an inventory and point of sale system with the following requirements:

**Products Table:**
- Create `products` table with: id, name, description, price, stock, category_id, created_at, updated_at, status (active/inactive)
- Create Product model in Prisma
- Generate migrations for products table

**Categories Table:**
- Create `product_categories` table with: id, name, description, color
- Create ProductCategory model in Prisma
- Generate migrations for product_categories table

**Sales Tables:**
- Create `sales` table with: id, total, payment_status (paid/unpaid), sale_date, customer_name (optional), notes
- Create `sale_items` table with: id, sale_id, product_id, quantity, unit_price, total
- Create Sale and SaleItem models in Prisma
- Generate migrations for sales tables

**Suppliers Table:**
- Create `suppliers` table with: id, name, contact_info, phone, email, address
- Create Supplier model in Prisma
- Generate migrations for suppliers table

---

## Prompt 2: Backend API Development (NestJS)

Create a complete REST API for inventory and point of sale system with the following controllers and services:

**Products API:**
- ProductsController with endpoints:
  - GET /products (with filters and pagination)
  - POST /products (create product)
  - PUT /products/:id (update product)
  - DELETE /products/:id (delete product)
  - GET /products/categories (list categories)
- ProductsService with business logic
- DTOs for validation (CreateProductDto, UpdateProductDto)

**Sales API:**
- SalesController with endpoints:
  - GET /sales (list sales with filters)
  - POST /sales (create new sale)
  - PUT /sales/:id (update sale)
  - PUT /sales/:id/payment-status (mark as paid/unpaid)
  - GET /sales/:id (sale details)
- SalesService with sales logic
- DTOs for sales (CreateSaleDto, UpdateSaleDto, SaleItemDto)

**Suppliers API:**
- SuppliersController with endpoints:
  - GET /suppliers (list suppliers)
  - POST /suppliers (create supplier)
  - PUT /suppliers/:id (update supplier)
  - DELETE /suppliers/:id (delete supplier)
- SuppliersService
- DTOs for suppliers

---

## Prompt 3: SDK Updates and TypeScript Types

Update the existing SDK to support the new inventory and point of sale functionality:

**SDK Endpoints:**
- Add product endpoints to SDK
- Add sales endpoints to SDK
- Add suppliers endpoints to SDK
- Create TypeScript types for all entities (Product, Sale, SaleItem, Supplier, ProductCategory)
- Add proper error handling for all new endpoints
- Include pagination support for list endpoints
- Add filtering and search capabilities

---

## Prompt 4: Mobile App Navigation and Structure

Set up the navigation and basic structure for the inventory/point of sale module in React Native/Expo:

**Navigation Setup:**
- Add point of sale icon to main navigation
- Create stack navigator for inventory/sales module
- Configure routes for all screens
- Set up proper navigation flow between screens
- Implement deep linking if needed

---

## Prompt 5: Main Inventory Screen

Create the main inventory screen with a grid layout of products:

**InventoryScreen Features:**
- Grid layout with product cards
- Display image, name, price, stock for each product
- Search functionality and category filters
- Prominent "New Sale" button (centered and highlighted)
- Pull to refresh functionality
- Navigation to product detail screen
- Loading states and error handling

---

## Prompt 6: New Sale Process Screen

Create a comprehensive new sale screen with shopping cart functionality:

**NewSaleScreen Features:**
- List of selected products
- Quantity counter for each product
- Automatic total calculation
- Optional customer name field
- Additional notes field
- Payment status toggle (paid/unpaid)
- "Complete Sale" button
- Cart management (add/remove products)
- Real-time price calculations

---

## Prompt 7: Sales History and Detail Screens

Create screens for viewing sales history and individual sale details:

**SalesHistoryScreen Features:**
- List of sales with date, total, payment status
- Filters by date and payment status
- Customer search functionality
- Navigation to sale detail screen
- Pagination for large datasets

**SaleDetailScreen Features:**
- Complete sale information (date, total, customer)
- List of sold products
- Payment status with ability to change
- Options to reprint or duplicate sale
- Edit capabilities if needed

---

## Prompt 8: Product Management Screen

Create a complete CRUD interface for product management:

**ProductsManagementScreen Features:**
- Product list with search functionality
- Form for creating/editing products
- Category management
- Stock control
- Product images handling
- Bulk operations
- Import/export functionality

---

## Prompt 9: Suppliers Management in "More" Section

Create supplier management functionality in the "More" section:

**SuppliersScreen Features:**
- List of suppliers
- Form for creating/editing suppliers
- Contact information management
- Product history by supplier
- Search and filter capabilities
- Supplier performance metrics

---

## Prompt 10: UI Components Library

Create reusable UI components for the inventory and point of sale system:

**Base Components:**
- ProductCard - Product card for grid display
- SaleItem - Sale item in process
- SaleHistoryItem - Item in sales history
- PaymentStatusToggle - Payment status toggle
- QuantitySelector - Quantity selector component
- PriceDisplay - Price display component

**Form Components:**
- ProductForm - Product creation/editing form
- SupplierForm - Supplier creation/editing form
- SaleForm - New sale form

**Filter Components:**
- ProductFilters - Product filtering component
- SalesFilters - Sales history filters
- SearchBar - Reusable search bar component

---

## Prompt 11: State Management and Data Fetching

Implement state management using TanStack Query and local state:

**TanStack Query Setup:**
- Product queries (useProducts, useProduct)
- Sales queries (useSales, useSale)
- Supplier queries (useSuppliers)
- Mutations for create/update operations
- Cache invalidation strategies
- Optimistic updates

**Local State Management:**
- Context for current sale cart
- State for filters and searches
- Point of sale configuration state
- Offline data synchronization

---

## Prompt 12: Advanced Point of Sale Features

Implement advanced features for the point of sale system:

**Advanced POS Features:**
- Automatic total calculation with taxes (if applicable)
- Product or total sale discounts
- Multiple payment methods
- Sale receipt generation
- Barcode scanner integration (optional)
- Low stock alerts
- Inventory movement tracking (in/out)
- Best-selling products reports
- Sales analysis by period

**Integration Features:**
- Data export (CSV, PDF)
- Automatic data backup
- Thermal printer configuration (optional)
- Profit analysis reports

---

## Implementation Checklist

- [x] Database and models setup
- [x] Backend API development (Products)
- [x] Backend API development (Sales)
- [x] Backend API development (Suppliers)
- [x] SDK updates and TypeScript types
- [x] Mobile app navigation structure
- [ ] Main inventory screen
- [ ] New sale process screen
- [ ] Sales history screen
- [ ] Sale detail screen
- [ ] Product management screen
- [ ] Suppliers management screen
- [ ] UI components library
- [ ] State management setup
- [ ] TanStack Query implementation
- [ ] Advanced POS features
- [ ] Integration features
- [ ] Testing and QA
- [ ] Documentation
- [ ] Deployment

---

## Recommended Implementation Order (15-20 days)

1. **Database and models** (1-2 days)
2. **Basic backend API** (2-3 days)
3. **SDK and types** (1 day)
4. **Base UI components** (2-3 days)
5. **Main inventory screen** (2 days)
6. **Sales process** (3-4 days)
7. **Sales history and details** (2 days)
8. **Product management** (2-3 days)
9. **Suppliers in "More" section** (1-2 days)
10. **Advanced features and reports** (2-3 days)
