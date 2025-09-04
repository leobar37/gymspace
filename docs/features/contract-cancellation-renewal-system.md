# Sistema de Cancelación y Renovación de Contratos

## Problema Actual

Cuando los clientes cancelan su membresía y luego desean renovar el servicio, el sistema actual presenta limitaciones:
- Los contratos cancelados no pueden ser renovados directamente
- No hay un flujo claro para reactivar servicios pausados
- Falta historial detallado de cancelaciones y reactivaciones
- No existe un período de gracia para reconsiderar cancelaciones

## Solución Propuesta

### 1. Estados de Contrato Mejorados

#### Estados Actuales (Mantener)
- `PENDING`: Contrato creado pero no iniciado
- `ACTIVE`: Contrato vigente
- `EXPIRING_SOON`: Próximo a vencer (últimos 7 días)
- `EXPIRED`: Contrato vencido por fecha

#### Estados Nuevos
- `SUSPENDED`: Contrato suspendido temporalmente (mantiene beneficios)
- `GRACE_PERIOD`: Período de gracia post-cancelación (7-15 días configurable)
- `TERMINATED`: Cancelación definitiva sin posibilidad de reactivación directa

### 2. Flujo de Cancelación

#### Cancelación Suave (Soft Cancellation)
```typescript
interface SoftCancellationDto {
  contractId: string;
  reason: CancellationReason;
  effectiveDate?: Date; // Por defecto: fin del período actual
  feedback?: string;
  offeredAlternatives?: boolean;
}

enum CancellationReason {
  PRICE_TOO_HIGH = 'price_too_high',
  NOT_USING_SERVICE = 'not_using_service',
  MOVING_LOCATION = 'moving_location',
  FINANCIAL_ISSUES = 'financial_issues',
  SERVICE_DISSATISFACTION = 'service_dissatisfaction',
  TEMPORARY_BREAK = 'temporary_break',
  OTHER = 'other'
}
```

**Proceso:**
1. Cliente solicita cancelación
2. Sistema registra motivo y feedback
3. Contrato pasa a `GRACE_PERIOD` al vencer
4. Durante período de gracia:
   - Cliente mantiene acceso limitado
   - Puede reactivar con un click
   - Recibe ofertas de retención
5. Después del período: `TERMINATED`

#### Suspensión Temporal
```typescript
interface SuspendContractDto {
  contractId: string;
  suspensionType: SuspensionType;
  startDate: Date;
  endDate?: Date; // Máximo 3 meses
  reason: string;
  maintainBenefits?: boolean; // Por defecto: false
}

enum SuspensionType {
  VACATION = 'vacation',
  MEDICAL = 'medical',
  FINANCIAL = 'financial',
  OTHER = 'other'
}
```

**Características:**
- Máximo 3 suspensiones por año
- Duración máxima: 3 meses por suspensión
- Opción de mantener beneficios parciales
- Reactivación automática o manual

### 3. Flujo de Renovación/Reactivación

#### Reactivación de Contrato Cancelado
```typescript
interface ReactivateContractDto {
  originalContractId: string;
  newPlanId?: string; // Puede cambiar de plan
  startDate: Date;
  applyWinBackOffer?: boolean;
  paymentMethodId: string;
}
```

**Proceso de Reactivación:**
1. **Desde GRACE_PERIOD**:
   - Reactivación instantánea
   - Mantiene historial y preferencias
   - Posible descuento de "win-back"

2. **Desde SUSPENDED**:
   - Reactivación según fecha programada
   - Ajuste prorrateado si aplica
   - Notificación de reactivación

3. **Desde TERMINATED**:
   - Crea nuevo contrato con referencia al anterior
   - Aplica ofertas de recuperación
   - Mantiene historial del cliente

#### Win-Back Campaigns
```typescript
interface WinBackOffer {
  id: string;
  targetReason: CancellationReason[];
  discountPercentage: number;
  validityDays: number;
  maxUsage: number;
  conditions: {
    minMonthsInactive?: number;
    maxMonthsInactive?: number;
    previousPlanTypes?: string[];
  };
}
```

### 4. Modelo de Datos

#### Tabla: contract_lifecycle_events
```sql
CREATE TABLE contract_lifecycle_events (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  reason VARCHAR(100),
  metadata JSONB,
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: contract_suspensions
```sql
CREATE TABLE contract_suspensions (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  suspension_type VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  maintain_benefits BOOLEAN DEFAULT FALSE,
  auto_reactivate BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: cancellation_feedback
```sql
CREATE TABLE cancellation_feedback (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  reason VARCHAR(100) NOT NULL,
  detailed_feedback TEXT,
  offered_alternatives BOOLEAN DEFAULT FALSE,
  would_recommend BOOLEAN,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. API Endpoints

#### Cancelación y Suspensión
```typescript
POST /api/v1/contracts/:id/cancel
POST /api/v1/contracts/:id/suspend
POST /api/v1/contracts/:id/resume
```

#### Reactivación
```typescript
POST /api/v1/contracts/:id/reactivate
GET /api/v1/contracts/reactivation-offers
```

#### Consultas
```typescript
GET /api/v1/contracts/:id/lifecycle-history
GET /api/v1/clients/:id/contract-history
GET /api/v1/analytics/cancellation-reasons
```

### 6. Notificaciones y Comunicación

#### Notificaciones Automáticas
1. **Pre-cancelación**:
   - Email con ofertas de retención
   - Recordatorio de beneficios perdidos

2. **Durante período de gracia**:
   - Día 1: Confirmación y opción de revertir
   - Día 3: Oferta especial de reactivación
   - Día 7: Último recordatorio

3. **Post-cancelación**:
   - 30 días: Oferta win-back
   - 60 días: Segunda oferta
   - 90 días: Oferta final

#### Templates de Email
```typescript
interface EmailTemplate {
  type: 'cancellation_confirmation' | 'grace_period_reminder' | 'win_back_offer';
  language: 'es' | 'en';
  variables: {
    clientName: string;
    gymName: string;
    daysRemaining?: number;
    discountPercentage?: number;
    reactivationLink: string;
  };
}
```

### 7. Dashboard y Reportes

#### Métricas Clave
- **Churn Rate**: Tasa de cancelación mensual
- **Recovery Rate**: Porcentaje de reactivaciones
- **LTV Impact**: Impacto en valor de vida del cliente
- **Retention Success**: Efectividad de ofertas de retención

#### Reportes
```typescript
interface CancellationAnalytics {
  period: DateRange;
  totalCancellations: number;
  byReason: Record<CancellationReason, number>;
  reactivations: number;
  averageLifetimeBeforeCancellation: number;
  winBackSuccess: number;
  projectedRevenueLoss: number;
  savedRevenue: number;
}
```

### 8. Configuración por Gimnasio

```typescript
interface RetentionSettings {
  gymId: string;
  gracePeriodDays: number; // 7-30 días
  maxSuspensionsPerYear: number; // 1-4
  maxSuspensionDays: number; // 30-90
  allowPartialRefunds: boolean;
  autoWinBackOffers: boolean;
  winBackDiscountPercentage: number; // 10-50%
}
```

### 9. Implementación Técnica

#### Servicios Backend

**ContractLifecycleService**
```typescript
class ContractLifecycleService {
  async cancelContract(context: IRequestContext, dto: SoftCancellationDto): Promise<Contract>;
  async suspendContract(context: IRequestContext, dto: SuspendContractDto): Promise<Contract>;
  async reactivateContract(context: IRequestContext, dto: ReactivateContractDto): Promise<Contract>;
  async getLifecycleHistory(context: IRequestContext, contractId: string): Promise<LifecycleEvent[]>;
  async processGracePeriodExpirations(): Promise<void>; // Cron job
  async sendRetentionOffers(): Promise<void>; // Cron job
}
```

**RetentionCampaignService**
```typescript
class RetentionCampaignService {
  async createWinBackOffer(context: IRequestContext, dto: CreateOfferDto): Promise<WinBackOffer>;
  async getEligibleOffers(context: IRequestContext, clientId: string): Promise<WinBackOffer[]>;
  async trackOfferPerformance(context: IRequestContext, offerId: string): Promise<OfferMetrics>;
}
```

#### Jobs Programados

1. **Daily Jobs**:
   - Procesar expiraciones de período de gracia
   - Reactivar suspensiones programadas
   - Actualizar estados de contrato

2. **Weekly Jobs**:
   - Enviar campañas de win-back
   - Generar reportes de retención
   - Analizar patrones de cancelación

### 10. Interfaz de Usuario (Mobile App)

#### Flujo de Cancelación
1. Cliente accede a "Mi Membresía"
2. Opción "Pausar o Cancelar"
3. Selecciona motivo con opciones:
   - Pausar temporalmente
   - Cancelar al final del período
   - Hablar con soporte
4. Confirmación con ofertas de retención
5. Resumen de fecha efectiva

#### Flujo de Reactivación
1. Cliente anterior ve banner "Vuelve con descuento"
2. Un click para reactivar
3. Selección de plan (mismo u otro)
4. Confirmación de pago
5. Acceso inmediato restaurado

### 11. Beneficios del Sistema

#### Para el Gimnasio
- Reduce churn rate en 15-25%
- Recupera 10-15% de clientes cancelados
- Insights sobre motivos de cancelación
- Automatización de retención
- Mayor LTV de clientes

#### Para el Cliente
- Flexibilidad para pausar servicio
- Período de gracia para reconsiderar
- Ofertas personalizadas de retorno
- Proceso simple de reactivación
- Historial preservado

### 12. Métricas de Éxito

- **Reducción de Churn**: Meta 20% menos cancelaciones definitivas
- **Tasa de Reactivación**: Meta 15% de cancelados vuelven
- **Satisfacción**: NPS >8 en proceso de cancelación
- **Tiempo de Reactivación**: <2 minutos
- **ROI de Retención**: 5:1 en campañas de win-back

### 13. Fases de Implementación

#### Fase 1 (2 semanas)
- Estados de contrato mejorados
- Cancelación suave básica
- Período de gracia

#### Fase 2 (2 semanas)
- Suspensión temporal
- Reactivación simple
- Historial de lifecycle

#### Fase 3 (3 semanas)
- Campañas de win-back
- Dashboard de retención
- Notificaciones automatizadas

#### Fase 4 (2 semanas)
- Análisis predictivo
- Ofertas personalizadas
- Optimización continua