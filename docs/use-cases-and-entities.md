### **Advisor (Asesor Personal)**
- Gestionar evaluaciones de clientes asignados
- Crear y completar evaluaciones
- Agregar comentarios de seguimiento
- Subir fotos y documentos de progreso
- Ver reportes de progreso de sus clientes
- **NO PUEDE:** Crear contratos, gestionar otros colaboradores, ver datos financieros## 3.9 GESTIÓN DE EVALUACIONES

### **CU-027: Configurar Estructura de Evaluaciones**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Configuración de Gimnasio"
2. Navega a "Estructura de Evaluaciones"
3. Define campos personalizados para evaluaciones:
   - Tipo de campo (número, texto, selección)
   - Label del campo
   - Descripción/instrucciones
   - Si es obligatorio
   - Unidades de medida
4. Configura estructura en JSON
5. Guarda configuración que aplica a todas las evaluaciones futuras

### **CU-028: Crear Evaluación de Cliente**
**Actor:** Owner, Manager, Advisor
**Flujo:**
1. Usuario selecciona cliente activo
2. Hace clic en "Nueva Evaluación"
3. Sistema verifica límite de evaluaciones del plan del cliente
4. Selecciona tipo de evaluación (inicial, progreso, final)
5. Asigna asesor si está disponible en el plan
6. Define duración de la evaluación en días
7. Completa datos iniciales según structure_evaluation del gimnasio
8. Sube fotos y documentos de entrada
9. Define objetivos y metas
10. Evaluación queda en estado "open"

### **CU-029: Gestionar Progreso de Evaluación**
**Actor:** Owner, Manager, Advisor
**Flujo:**
1. Usuario accede a evaluación activa
2. Agrega comentarios de seguimiento:
   - Notas de progreso
   - Registro de llamadas
   - Reuniones
   - Recordatorios
3. Sube assets adicionales (fotos de progreso, documentos)
4. Actualiza estado si es necesario
5. Sistema calcula días restantes automáticamente

### **CU-030: Finalizar Evaluación**
**Actor:** Owner, Manager, Advisor
**Flujo:**
1. Usuario accede a evaluación próxima a vencer
2. Completa datos finales usando misma estructura de datos iniciales
3. Sube fotos y documentos de salida
4. Sistema calcula progreso comparando datos iniciales vs finales
5. Escribe resumen de resultados
6. Marca evaluación como "completed"
7. Sistema genera reporte comparativo automático

### **CU-031: Alertas de Evaluaciones**
**Actor:** Sistema
**Flujo Automático:**
1. Sistema revisa evaluaciones diariamente
2. Identifica evaluaciones próximas a vencer (3, 7, 1 días)
3. Genera notificaciones para asesores asignados
4. Envía recordatorios a managers y owners
5. Marca evaluaciones vencidas sin completar

## 3.10 GESTIÓN DE CATÁLOGO PÚBLICO

### **CU-032: Publicar Catálogo de Gimnasio**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario configura visibilidad pública del gimnasio
2. Selecciona planes de membresía a mostrar públicamente
3. Configura información de colaboradores a mostrar:
   - Foto de perfil y cover
   - Descripción y especialidades
   - Horarios de atención
4. Personaliza página pública del gimnasio
5. Sistema genera URL pública del catálogo
6. Catálogo queda disponible sin autenticación

### **CU-033: Gestionar Perfil de Colaborador**
**Actor:** Collaborator, Manager, Owner
**Flujo:**
1. Colaborador accede a su perfil
2. Sube foto de perfil y foto de cover
3. Completa descripción personal
4. Define especialidades y certificaciones
5. Configura horarios de disponibilidad
6. Guarda cambios
7. Información queda disponible para catálogo público### **Client_Assets** (Assets Generales de Clientes)
```
- id: UUID
- gym_client_id: UUID (FK Gym_Clients)
- asset_id: UUID (FK Assets)
- asset_category: Enum (medical_document, identification, insurance, contract_copy, other)
- description: String
- is_required: Boolean
- expiration_date: Date (nullable - para documentos con vencimiento)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```### **Comment_Assets** (Assets de Comentarios)
```
- id: UUID
- evaluation_comment_id: UUID (FK Evaluation_Comments)
- asset_id: UUID (FK Assets)
- description: String
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```### **Evaluation_Assets** (Assets de Evaluaciones)
```
- id: UUID
- evaluation_id: UUID (FK Evaluations)
- asset_id: UUID (FK Assets)
- asset_stage: Enum (initial, progress, final)
- asset_category: Enum (body_photo, measurement_photo, document, report, other)
- description: String
- measurement_type: String (nullable - ej: "peso", "talla", "masa_muscular")
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```### **Evaluation_Comments** (Comentarios de Evaluaciones)
```
- id: UUID
- evaluation_id: UUID (FK Evaluations)
- comment_type: Enum (progress_note, phone_call, meeting, reminder, other)
- comment: Text
- is_private: Boolean (solo visible para staff)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```### **Evaluations** (Evaluaciones de Clientes)
```
- id: UUID
- gym_client_id: UUID (FK Gym_Clients)
- contract_id: UUID (FK Contracts, nullable)
- advisor_id: UUID (FK Collaborators, nullable - asesor asignado)
- evaluation_type: Enum (initial, progress, final)
- status: Enum (open, in_progress, completed, cancelled)
- duration_days: Integer (duración planificada en días)
- planned_end_date: Date (fecha planificada de finalización)
- actual_end_date: Date (nullable - fecha real de finalización)
- initial_data: JSON (datos de entrada según structure_evaluation)
- final_data: JSON (nullable - datos de salida)
- progress_percentage: Decimal (nullable - % de progreso calculado)
- goals: Text (objetivos de la evaluación)
- results_summary: Text (nullable - resumen de resultados)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- completed_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```### **CU-024: Auditoría y Trazabilidad**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a cualquier registro del sistema
2. Sistema muestra información de auditoría:
   - Quién creó el registro y cuándo
   - Quién hizo la última modificación y cuándo
   - Historial de cambios importantes
3. Para registros eliminados (soft delete):
   - Se mantiene visible en auditorías
   - Se marca como "eliminado" con fecha y usuario
   - No aparece en consultas normales del sistema

### **CU-025: Gestión de Eliminaciones (Soft Delete)**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario selecciona registro a eliminar
2. Sistema verifica dependencias activas
3. Si hay dependencias, informa al usuario y sugiere acciones
4. Si no hay impedimentos, realiza soft delete:
   - Marca deleted_at con timestamp actual
   - Registra deleted_by_user_id
   - Mantiene integridad referencial
5. Registro desaparece de consultas normales pero se conserva para auditoría

### **CU-026: Recuperación de Registros Eliminados**
**Actor:** Owner (solo)
**Flujo:**
1. Owner accede a "Registros Eliminados"
2. Ve lista de registros con soft delete
3. Selecciona registro a recuperar
4. Sistema verifica que sea seguro restaurar
5. Limpia deleted_at y deleted_by_user_id
6. Registro vuelve a estar activo en el sistema## **Nuevos Casos de Uso - Gestión de Assets**

### **CU-021: Configurar Organización**
**Actor:** Owner
**Flujo:**
1. Owner accede a "Configuración de Organización"
2. Selecciona país de operación
3. Configura moneda principal (USD, EUR, PEN, etc.)
4. Define zona horaria
5. Configura ajustes adicionales
6. Guarda configuración
7. Sistema aplica configuración a todos los gimnasios

### **CU-022: Gestionar Assets Centralizados**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Gestión de Archivos"
2. Ve lista de todos los assets del gimnasio
3. Puede filtrar por tipo de entidad (contratos, clientes, etc.)
4. Puede descargar, ver detalles o eliminar assets
5. Sistema mantiene trazabilidad de cambios
6. Assets eliminados cambian a status "deleted"

### **CU-023: Aplicar Precios Personalizados**
**Actor:** Owner, Manager
**Flujo:**
1. Al crear contrato, usuario selecciona plan de membresía
2. Sistema verifica si el plan permite precios personalizados
3. Si está permitido, muestra opción de personalizar precio
4. Usuario puede ingresar precio custom o aplicar descuentos
5. Sistema calcula precio final automáticamente
6. Muestra desglose de precios (base, personalizado, descuentos)
7. Confirma y crea contrato con pricing detallado### **Contract_Assets** (Relación Contratos-Assets)
```
- id: UUID
- contract_id: UUID (FK Contracts)
- asset_id: UUID (FK Assets)
- asset_type: Enum (payment_receipt, contract_document, identification, other)
- description: String
- is_required: Boolean
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```# Gym Management System - MVP Documentation

## 1. ENTIDADES DEL SISTEMA

### **Subscription_Plans** (Planes SaaS)
```
- id: UUID
- name: String (Básico, Premium, Enterprise)
- price: Decimal
- billing_frequency: Enum (monthly, yearly)
- max_gyms: Integer
- max_clients_per_gym: Integer
- max_users_per_gym: Integer
- features: JSON
- description: Text
- created_by_user_id: UUID (FK Users, nullable - sistema)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Users** (Usuarios del Sistema)
```
- id: UUID
- email: String (unique)
- password: String (hashed)
- name: String
- phone: String
- user_type: Enum (owner, collaborator)
- email_verified_at: Timestamp
- created_by_user_id: UUID (FK Users, nullable - autorregistro)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Organizations** (Organizaciones/Empresas)
```
- id: UUID
- owner_user_id: UUID (FK Users)
- name: String
- subscription_plan_id: UUID (FK Subscription_Plans)
- subscription_status: Enum (active, inactive, expired)
- subscription_start: Date
- subscription_end: Date
- country: String
- currency: String (ISO 4217 code: USD, EUR, PEN, etc.)
- timezone: String
- settings: JSON (configuraciones adicionales)
- created_by_user_id: UUID (FK Users, mismo que owner_user_id)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Gyms** (Gimnasios)
```
- id: UUID
- organization_id: UUID (FK Organizations)
- name: String
- address: Text
- description: Text
- phone: String
- gym_code: String (unique, for invitations)
- profile_asset_id: UUID (FK Assets, nullable)
- cover_asset_id: UUID (FK Assets, nullable)
- evaluation_structure: JSON (campos para evaluaciones)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Roles** (Roles del Sistema)
```
- id: UUID
- name: String (Owner, Manager, Staff, Advisor)
- permissions: JSON Array
- description: Text
- can_manage_evaluations: Boolean (puede gestionar evaluaciones)
- created_by_user_id: UUID (FK Users, nullable - sistema)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Collaborators** (Trabajadores/Colaboradores)
```
- id: UUID
- user_id: UUID (FK Users)
- gym_id: UUID (FK Gyms)
- role_id: UUID (FK Roles)
- status: Enum (pending, active, inactive)
- hired_date: Date
- invitation_id: UUID (FK Invitations)
- profile_asset_id: UUID (FK Assets, nullable)
- cover_asset_id: UUID (FK Assets, nullable)
- description: Text (nullable)
- specialties: JSON Array (especialidades del colaborador)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Invitations** (Invitaciones a Colaboradores)
```
- id: UUID
- gym_id: UUID (FK Gyms)
- email: String
- role_id: UUID (FK Roles)
- token: String (unique)
- status: Enum (pending, accepted, expired)
- invited_by_user_id: UUID (FK Users)
- expires_at: Timestamp
- accepted_by_user_id: UUID (FK Users, nullable)
- accepted_at: Timestamp (nullable)
- created_by_user_id: UUID (FK Users, mismo que invited_by_user_id)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Gym_Clients** (Clientes del Gimnasio)
```
- id: UUID
- gym_id: UUID (FK Gyms)
- client_number: String (auto-generated)
- name: String
- birth_date: Date
- document_id: String
- phone: String
- email: String (nullable)
- status: Enum (active, inactive)
- profile_asset_id: UUID (FK Assets, nullable)
- emergency_contact_name: String (nullable)
- emergency_contact_phone: String (nullable)
- medical_conditions: Text (nullable)
- notes: Text (nullable)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Gym_Membership_Plans** (Planes de Membresía)
```
- id: UUID
- gym_id: UUID (FK Gyms)
- name: String
- base_price: Decimal (precio base del plan)
- currency: String (heredado de organización)
- duration_months: Integer
- description: Text
- features: JSON Array (características del plan)
- terms_and_conditions: Text
- allows_custom_pricing: Boolean (si permite precio personalizado)
- max_evaluations: Integer (máximo de evaluaciones incluidas)
- includes_advisor: Boolean (incluye asesor personal)
- status: Enum (active, inactive, archived)
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Contracts** (Contratos de Membresía)
```
- id: UUID
- gym_client_id: UUID (FK Gym_Clients)
- gym_membership_plan_id: UUID (FK Gym_Membership_Plans)
- start_date: Date
- end_date: Date
- base_price: Decimal (precio del plan al momento del contrato)
- custom_price: Decimal (precio personalizado para este contrato)
- final_amount: Decimal (precio final aplicado)
- currency: String (heredado de organización)
- discount_percentage: Decimal (opcional)
- discount_amount: Decimal (opcional)
- status: Enum (pending, active, expiring_soon, expired, cancelled)
- payment_frequency: Enum (monthly, quarterly, annual)
- notes: Text
- terms_and_conditions: Text
- created_by_user_id: UUID (FK Users)
- updated_by_user_id: UUID (FK Users, nullable)
- approved_by_user_id: UUID (FK Users, nullable)
- approved_at: Timestamp (nullable)
- cancelled_by_user_id: UUID (FK Users, nullable)
- cancelled_at: Timestamp (nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Assets** (Gestión Centralizada de Archivos)
```
- id: UUID
- filename: String
- original_name: String
- file_path: String (S3 path)
- file_size: Integer (bytes)
- mime_type: String
- entity_type: String (contract, user, gym, etc.)
- entity_id: UUID (referencia genérica)
- uploaded_by_user_id: UUID (FK Users)
- metadata: JSON (dimensiones, descripción, etc.)
- status: Enum (active, deleted)
- created_by_user_id: UUID (FK Users, mismo que uploaded_by_user_id)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

### **Check_ins** (Registro de Entradas)
```
- id: UUID
- gym_client_id: UUID (FK Gym_Clients)
- gym_id: UUID (FK Gyms)
- timestamp: Timestamp
- registered_by_user_id: UUID (FK Users)
- notes: Text
- created_by_user_id: UUID (FK Users, mismo que registered_by_user_id)
- updated_by_user_id: UUID (FK Users, nullable)
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (nullable - soft delete)
```

---

## 2. SISTEMA DE PERMISOS

### **Owner (Propietario)**
- Gestión completa de organización y suscripción
- CRUD completo de gimnasios
- Invitar/gestionar colaboradores
- Acceso a todos los módulos
- Reportes financieros y analíticos

### **Manager (Encargado)**
- Crear nuevos contratos
- Gestionar clientes (CRUD)
- Ver dashboard y reportes básicos
- Registrar check-ins
- **NO PUEDE:** Modificar contratos existentes, configuraciones del sistema

### **Staff (Personal)**
- Solo registrar check-ins
- Ver información básica de clientes
- **NO PUEDE:** Crear contratos, ver reportes, gestionar clientes

---

## 3. CASOS DE USO

## 3.1 GESTIÓN DE REGISTRO Y AUTENTICACIÓN

### **CU-001: Registro de Propietario**
**Actor:** Nuevo Usuario (Propietario)
**Flujo:**
1. Usuario accede a la aplicación
2. Selecciona "Soy Dueño"
3. Completa formulario de registro (nombre, email, teléfono, contraseña)
4. Selecciona plan de suscripción
5. Verifica email
6. Crea su primera organización
7. Sistema genera acceso completo

### **CU-002: Invitación de Colaboradores**
**Actor:** Owner/Manager
**Flujo:**
1. Owner accede a "Gestión de Colaboradores"
2. Hace clic en "Invitar Colaborador"
3. Completa formulario (email, gimnasio, rol)
4. Sistema envía email de invitación
5. Colaborador recibe email con link único
6. Colaborador completa registro
7. Sistema activa acceso al gimnasio

### **CU-003: Login de Usuarios**
**Actor:** Usuario Registrado
**Flujo:**
1. Usuario ingresa email y contraseña
2. Sistema valida credenciales
3. Redirige según tipo de usuario:
   - Owner: Dashboard principal
   - Collaborator: Dashboard del gimnasio asignado

## 3.2 GESTIÓN DE GIMNASIOS

### **CU-004: Crear Gimnasio**
**Actor:** Owner
**Precondición:** No exceder límite del plan
**Flujo:**
1. Owner accede a "Mis Gimnasios"
2. Hace clic en "Agregar Gimnasio"
3. Completa información (nombre, dirección, descripción)
4. Sistema genera código único del gimnasio
5. Gimnasio queda disponible para operaciones

### **CU-005: Editar Información del Gimnasio**
**Actor:** Owner
**Flujo:**
1. Owner selecciona gimnasio a editar
2. Modifica información requerida
3. Guarda cambios
4. Sistema actualiza información

## 3.3 GESTIÓN DE CLIENTES

### **CU-006: Registrar Nuevo Cliente**
**Actor:** Owner, Manager
**Precondición:** No exceder límite de clientes del plan
**Flujo:**
1. Usuario accede a "Clientes"
2. Hace clic en "Nuevo Cliente"
3. Completa formulario (nombre, fecha nacimiento, documento, teléfono)
4. Sistema genera número de cliente automático
5. Cliente queda registrado y disponible

### **CU-007: Buscar Cliente**
**Actor:** Owner, Manager, Staff
**Flujo:**
1. Usuario accede a lista de clientes
2. Utiliza filtros de búsqueda (nombre, documento, número)
3. Sistema muestra resultados coincidentes
4. Usuario selecciona cliente deseado

### **CU-008: Editar Cliente**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario busca y selecciona cliente
2. Hace clic en "Editar"
3. Modifica información necesaria
4. Guarda cambios
5. Sistema actualiza información del cliente

## 3.4 GESTIÓN DE PLANES DE MEMBRESÍA

### **CU-009: Crear Plan de Membresía**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Planes de Membresía"
2. Hace clic en "Nuevo Plan"
3. Completa información básica (nombre, descripción)
4. Define precio base en la moneda de la organización
5. Especifica duración en meses
6. Agrega características y beneficios del plan
7. Define términos y condiciones
8. Configura si permite personalización de precios
9. Activa plan
10. Plan queda disponible para contratos

### **CU-010: Editar Plan de Membresía**
**Actor:** Owner
**Flujo:**
1. Usuario selecciona plan existente
2. Modifica información requerida
3. Guarda cambios
4. Sistema actualiza plan (no afecta contratos existentes)

## 3.5 GESTIÓN DE CONTRATOS

### **CU-011: Crear Contrato**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario selecciona cliente
2. Hace clic en "Nuevo Contrato"
3. Selecciona plan de membresía
4. Sistema muestra precio base del plan
5. Usuario puede personalizar precio si el plan lo permite
6. Aplica descuentos si es necesario (porcentaje o monto fijo)
7. Define fechas de inicio y fin
8. Especifica frecuencia de pago
9. Agrega notas y términos específicos
10. Contrato queda en estado "Pendiente"
11. Sistema calcula precio final con moneda de la organización

### **CU-012: Subir Comprobantes y Documentos**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a contrato pendiente
2. Hace clic en "Gestionar Documentos"
3. Selecciona tipo de documento (comprobante de pago, identificación, contrato firmado)
4. Sube archivo usando el módulo de Assets
5. Sistema almacena en S3 y crea registro en Assets
6. Vincula asset al contrato mediante Contract_Assets
7. Agrega descripción y marca si es requerido
8. Sistema valida si todos los documentos requeridos están completos
9. Contrato puede ser activado cuando documentación esté completa

### **CU-013: Activar Contrato**
**Actor:** Owner
**Flujo:**
1. Owner revisa contrato con comprobantes
2. Verifica información y pagos
3. Hace clic en "Activar Contrato"
4. Sistema cambia estado a "Activo"
5. Cliente puede hacer check-ins

## 3.6 CONTROL DE ACCESO

### **CU-014: Registrar Check-in**
**Actor:** Owner, Manager, Staff
**Flujo:**
1. Cliente llega al gimnasio
2. Usuario busca cliente en el sistema
3. Verifica membresía activa
4. Hace clic en "Check-in"
5. Sistema registra entrada con timestamp
6. Cliente puede acceder a instalaciones

### **CU-015: Ver Historial de Check-ins**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Historial de Visitas"
2. Filtra por cliente, fecha o período
3. Sistema muestra lista de check-ins
4. Usuario puede exportar reportes

## 3.7 NOTIFICACIONES Y ALERTAS

### **CU-016: Alertas de Vencimiento**
**Actor:** Sistema
**Flujo Automático:**
1. Sistema ejecuta tarea diaria
2. Identifica contratos próximos a vencer
3. Marca contratos como "expiring_soon" (30, 15, 7, 1 días)
4. Genera notificaciones en dashboard
5. Envía alertas a owners/managers

### **CU-017: Cambio de Estado Automático**
**Actor:** Sistema
**Flujo Automático:**
1. Sistema verifica contratos diariamente
2. Identifica contratos vencidos
3. Cambia estado a "expired"
4. Cliente no puede hacer más check-ins
5. Genera reporte de membresías vencidas

## 3.8 REPORTES Y DASHBOARD

### **CU-018: Dashboard Principal**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede al sistema
2. Dashboard muestra:
   - Clientes activos vs total
   - Contratos próximos a vencer
   - Check-ins del día
   - Ingresos del mes
   - Contratos pendientes

### **CU-019: Reportes de Ingresos**
**Actor:** Owner
**Flujo:**
1. Owner accede a "Reportes Financieros"
2. Selecciona período (mensual, trimestral, anual)
3. Sistema genera reporte con:
   - Ingresos totales
   - Ingresos por plan
   - Proyecciones
4. Opción de exportar a PDF/Excel

### **CU-020: Reporte de Asistencia**
**Actor:** Owner, Manager
**Flujo:**
1. Usuario accede a "Reportes de Asistencia"
2. Selecciona período y filtros
3. Sistema muestra:
   - Clientes más frecuentes
   - Horarios pico
   - Promedio de visitas por cliente
4. Gráficos y estadísticas visuales

---

## 5. REGLAS DE AUDITORÍA Y SOFT DELETE

### **Soft Delete Policy:**
- **Nunca eliminación física:** Todos los registros usan soft delete con `deleted_at`
- **Consultas automáticas:** ORM configurado para excluir registros eliminados por defecto
- **Integridad referencial:** Verificar dependencias antes de soft delete
- **Recuperación:** Solo propietarios pueden restaurar registros eliminados

### **Metadata de Auditoría:**
- **created_by_user_id:** Obligatorio en creación, identifica quién creó el registro
- **updated_by_user_id:** Se actualiza automáticamente en cada modificación
- **Timestamps:** created_at, updated_at se manejan automáticamente por ORM
- **Trazabilidad completa:** Historial de quién, qué y cuándo para cada operación

### **Casos Especiales:**
- **Usuarios del sistema:** created_by_user_id puede ser null para autorregistros
- **Planes SaaS:** created_by_user_id null indica creación por sistema
- **Relaciones cascada:** Soft delete propaga a entidades dependientes cuando es necesario
- **Validaciones únicas:** Deben considerar solo registros no eliminados (deleted_at IS NULL)

---

## 6. REGLAS DE NEGOCIO

### **Límites por Plan de Suscripción:**
- Plan Básico: 1 gimnasio, 100 clientes, 3 usuarios, 50 evaluaciones/mes
- Plan Premium: 3 gimnasios, 500 clientes, 10 usuarios, 200 evaluaciones/mes
- Plan Enterprise: Ilimitado

### **Estados de Evaluación:**
- **Open:** Recién creada, esperando datos iniciales
- **In Progress:** Activa, con seguimiento en curso
- **Completed:** Finalizada con datos completos
- **Cancelled:** Cancelada antes de completarse

### **Tipos de Evaluación:**
- **Initial:** Primera evaluación del cliente
- **Progress:** Evaluación intermedia de progreso
- **Final:** Evaluación de cierre de programa

### **Estados de Contrato:**
- **Pending:** Recién creado, esperando documentos/pago
- **Active:** Pagado y vigente, cliente puede hacer check-ins
- **Expiring Soon:** Activo pero vence en menos de 30 días
- **Expired:** Vencido, cliente no puede acceder
- **Cancelled:** Cancelado manualmente

### **Validaciones:**
- Email único por usuario (excluyendo soft deleted)
- Documento de identidad único por gimnasio (excluyendo soft deleted)
- Número de cliente auto-generado secuencial
- Check-in solo para clientes con contrato activo (no soft deleted)
- Solo owners pueden modificar contratos existentes
- Moneda debe ser válida (código ISO 4217)
- País debe estar en lista de países soportados
- Custom_price solo se permite si el plan tiene allows_custom_pricing = true
- Final_amount se calcula automáticamente considerando descuentos
- Assets deben tener entity_type y entity_id válidos
- Solo se pueden subir tipos de archivo permitidos según mime_type
- **Soft Delete:** Todas las consultas deben excluir registros con deleted_at no nulo
- **Metadata de Auditoría:** created_by_user_id es obligatorio, updated_by_user_id se actualiza en cada modificación
- **Integridad Referencial:** No se pueden eliminar físicamente registros con dependencias activas
- **Evaluaciones:** No exceder max_evaluations del plan contratado
- **Estructura de Evaluación:** Campos obligatorios deben completarse antes de finalizar
- **Assets de Evaluación:** Fotos iniciales y finales son obligatorias para completar evaluación
- **Asesores:** Solo colaboradores con rol "Advisor" pueden ser asignados a evaluaciones

### **Notificaciones:**
- Alertas de vencimiento de contratos: 30, 15, 7, 1 días antes
- Email de bienvenida al registrarse
- Email de invitación a colaboradores
- Notificaciones en dashboard para acciones pendientes
- **Alertas de evaluaciones:** Próximas a vencer (7, 3, 1 días)
- **Recordatorios para asesores:** Evaluaciones pendientes de completar
- **Notificaciones de progreso:** Cuando se agregan comentarios importantes
- **Alertas de límites:** Cuando se acerca al máximo de evaluaciones del plan