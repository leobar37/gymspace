# Sistema de Inventario - Gym Management

## ENTIDADES DEL INVENTARIO

### **Inventory_Categories** (Categorías de Productos)
```
- id: UUID
- gym_id: UUID (FK Gyms)
- name: String (Agua, Suplementos, Pre-entrenos, Snacks, etc.)
- description: Text (nullable)
- sort_order: Integer
- status: Enum (active, inactive)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Inventory_Products** (Productos del Inventario)
```
- id: UUID
- gym_id: UUID (FK Gyms)
- category_id: UUID (FK Inventory_Categories)
- name: String
- description: Text (nullable)
- sku: String (código único del producto)
- barcode: String (nullable - código de barras)
- sale_price: Decimal (precio de venta)
- cost_price: Decimal (precio de compra/costo)
- currency: String (heredado de organización)
- image_asset_id: UUID (FK Assets, nullable)
- status: Enum (active, inactive, discontinued)
- track_inventory: Boolean (true para productos con stock, false para servicios)
- min_stock_alert: Integer (nullable - alerta de stock mínimo)
- max_stock_limit: Integer (nullable - límite máximo de stock)
- unit_of_measure: String (unidad, botella, sobre, etc.)
- supplier_info: JSON (información del proveedor)
- notes: Text (nullable - notas internas)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Inventory_Stock** (Control de Stock)
```
- id: UUID
- product_id: UUID (FK Inventory_Products)
- gym_id: UUID (FK Gyms)
- current_stock: Integer (stock actual)
- reserved_stock: Integer (stock reservado, default 0)
- available_stock: Integer (calculado: current - reserved)
- reorder_point: Integer (punto de reorden)
- last_restock_date: Date (nullable)
- last_restock_quantity: Integer (nullable)
- last_counted_date: Date (nullable - último conteo físico)
- last_counted_by_user_id: UUID (FK Users, nullable)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
```

### **Inventory_Movements** (Movimientos de Inventario)
```
- id: UUID
- product_id: UUID (FK Inventory_Products)
- gym_id: UUID (FK Gyms)
- movement_type: Enum (purchase, sale, adjustment, transfer, return, damage, expired)
- quantity: Integer (positivo para entradas, negativo para salidas)
- unit_cost: Decimal (nullable - costo unitario en compras)
- unit_price: Decimal (nullable - precio de venta en ventas)
- total_amount: Decimal (nullable - monto total de la transacción)
- reference_type: String (nullable - tipo de referencia: 'sale', 'purchase_order', 'adjustment')
- reference_id: String (nullable - ID de la referencia)
- notes: Text (nullable - razón del movimiento)
- batch_number: String (nullable - número de lote)
- expiration_date: Date (nullable - fecha de vencimiento del lote)
- previous_stock: Integer (stock antes del movimiento)
- new_stock: Integer (stock después del movimiento)
- created_by_user_id: UUID (FK Users)
- created_at: Timestamp
```

### **Inventory_Sales** (Ventas de Productos)
```
- id: UUID
- gym_id: UUID (FK Gyms)
- gym_client_id: UUID (FK Gym_Clients, nullable - puede ser venta sin cliente registrado)
- sale_number: String (auto-generated - número de venta)
- sale_date: Timestamp
- subtotal: Decimal
- tax_amount: Decimal (nullable - impuestos si aplica)
- discount_amount: Decimal (nullable - descuentos aplicados)
- total_amount: Decimal
- currency: String
- payment_method: Enum (cash, card, transfer, credit, gym_credit)
- payment_reference: String (nullable - referencia de pago)
- status: Enum (pending, completed, cancelled, refunded)
- notes: Text (nullable)
- sold_by_user_id: UUID (FK Users)
- created_by_user_id: UUID (FK Users, mismo que sold_by_user_id)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Inventory_Sale_Items** (Ítems de Venta)
```
- id: UUID
- sale_id: UUID (FK Inventory_Sales)
- product_id: UUID (FK Inventory_Products)
- quantity: Integer
- unit_price: Decimal (precio al momento de la venta)
- unit_cost: Decimal (costo al momento de la venta)
- line_total: Decimal (quantity * unit_price)
- discount_percentage: Decimal (nullable - descuento por item)
- discount_amount: Decimal (nullable - descuento en monto)
- final_line_total: Decimal (línea total después de descuentos)
- created_at: Timestamp
```

---

## CASOS DE USO - INVENTARIO

### **CU-034: Configurar Categorías de Productos**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Inventario" → "Categorías"
2. Ve lista de categorías existentes
3. Hace clic en "Nueva Categoría"
4. Completa información:
   - Nombre de la categoría
   - Descripción opcional
   - Orden de visualización
5. Guarda categoría
6. Categoría queda disponible para productos

### **CU-035: Registrar Nuevo Producto**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Inventario" → "Productos"
2. Hace clic en "Agregar Producto"
3. Completa información básica:
   - Nombre del producto
   - Categoría
   - Descripción
   - SKU (auto-generado o manual)
   - Código de barras (opcional)
4. Configura precios:
   - Precio de venta
   - Precio de compra/costo
   - Moneda del gimnasio
5. Configura inventario:
   - Si trackea stock o no
   - Stock mínimo para alertas
   - Stock máximo permitido
   - Unidad de medida
6. Sube imagen del producto (opcional)
7. Agrega información del proveedor
8. Guarda producto con stock inicial en 0

### **CU-036: Entrada de Mercancía (Compra/Restock)**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Inventario" → "Movimientos"
2. Selecciona "Entrada de Mercancía"
3. Busca y selecciona producto(s)
4. Para cada producto ingresa:
   - Cantidad recibida
   - Costo unitario
   - Fecha de vencimiento (si aplica)
   - Número de lote (si aplica)
5. Agrega notas sobre la compra
6. Confirma entrada
7. Sistema actualiza stock automáticamente
8. Genera movimiento de inventario

### **CU-037: Venta de Productos**
**Actor:** Owner, Manager, Staff
**Flujo:**
1. Cliente solicita producto en recepción
2. Usuario accede a "Punto de Venta"
3. Busca producto por nombre, SKU o código de barras
4. Selecciona producto y cantidad
5. Sistema valida stock disponible
6. Agrega más productos si es necesario
7. Aplica descuentos si corresponde
8. Selecciona cliente (opcional, puede ser venta anónima)
9. Elige método de pago
10. Confirma venta
11. Sistema:
    - Genera número de venta
    - Actualiza stock automáticamente
    - Crea movimiento de inventario
    - Genera recibo/comprobante

### **CU-038: Ajuste de Inventario**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario realiza conteo físico de productos
2. Accede a "Inventario" → "Ajustes"
3. Selecciona producto a ajustar
4. Ingresa:
   - Stock real encontrado
   - Razón del ajuste (diferencia, daño, vencimiento, etc.)
   - Notas explicativas
5. Sistema calcula diferencia automáticamente
6. Confirma ajuste
7. Sistema actualiza stock y genera movimiento

### **CU-039: Alertas de Stock Bajo**
**Actor:** Sistema
**Flujo Automático:**
1. Sistema revisa stock diariamente
2. Identifica productos con stock <= punto de reorden
3. Genera alertas para managers y owners
4. Muestra notificaciones en dashboard
5. Envía recordatorios por email (opcional)
6. Sugiere cantidad de reorden basada en historial

### **CU-040: Reportes de Inventario**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Reportes" → "Inventario"
2. Selecciona tipo de reporte:
   - Valorización de inventario
   - Productos más vendidos
   - Movimientos por período
   - Margen de ganancia por producto
   - Stock actual por categoría
3. Define período de análisis
4. Sistema genera reporte
5. Opción de exportar a PDF/Excel

### **CU-041: Gestión de Proveedores**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Inventario" → "Proveedores"
2. Registra información del proveedor:
   - Nombre/Razón social
   - Contacto y teléfonos
   - Productos que suministra
   - Términos de pago
   - Notas
3. Vincula productos con sus proveedores
4. Utiliza información para generar órdenes de compra

---

## PERMISOS DE INVENTARIO

### **Owner (Propietario)**
- Control completo sobre inventario
- Crear, modificar y eliminar productos
- Acceso a todos los reportes y márgenes
- Configurar categorías y proveedores
- Ver costos y rentabilidad

### **Manager (Encargado)**
- Gestión completa de inventario: productos, ventas, stock, reportes
- NO PUEDE: Eliminar productos con movimientos históricos

### **Staff (Personal)**
- Venta de productos: acceso al punto de venta, consulta de precios y stock
- NO PUEDE: Gestionar productos, acceder a costos/márgenes, ver reportes financieros

---

## VALIDACIONES DE INVENTARIO

- **SKU único por gimnasio:** No duplicar códigos de producto dentro del mismo gimnasio
- **Stock no negativo:** No permitir ventas que dejen stock negativo si track_inventory = true
- **Precios válidos:** Sale_price debe ser mayor que cost_price, ambos mayores a 0
- **Movimientos de inventario:** Cantidad debe ser != 0, previous_stock + quantity = new_stock
- **Ventas completadas:** No modificar ventas en estado 'completed', solo cancelar/reembolsar
- **Stock reservado:** reserved_stock no puede ser mayor que current_stock
- **Fechas de vencimiento:** No vender productos vencidos automáticamente

---

## NOTIFICACIONES DE INVENTARIO

- **Alertas de stock bajo:** Productos por debajo del punto de reorden
- **Notificaciones de ventas:** Confirmación de venta completada
- **Alertas de productos vencidos:** Productos próximos a vencer (7, 3, 1 días)
- **Reportes de inventario:** Resumen semanal/mensual de movimientos y valorización

---

## CARACTERÍSTICAS PRINCIPALES

### **Control de Stock en Tiempo Real**
- Actualización automática con cada venta
- Reserva de stock para transacciones pendientes
- Alertas automáticas de reorden

### **Punto de Venta Integrado**
- Búsqueda rápida por múltiples criterios
- Ventas anónimas o a clientes registrados
- Múltiples métodos de pago
- Descuentos flexibles

### **Trazabilidad Completa**
- Historial completo de movimientos
- Auditoría de cambios de stock
- Números de lote y fechas de vencimiento
- Razones documentadas para ajustes

### **Reportes y Analytics**
- Valorización de inventario actual
- Análisis de productos más vendidos
- Márgenes de ganancia por producto
- Tendencias de ventas por período