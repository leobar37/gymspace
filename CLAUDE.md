# CLAUDE.md

Esta guía proporciona orientación completa para trabajar con el código de GymSpace, un sistema de gestión de gimnasios multi-tenant.

## Resumen del Proyecto

GymSpace es un sistema de gestión de gimnasios multi-tenant construido como monorepo pnpm con:
- **Backend**: NestJS + PostgreSQL + Redis
- **Frontend Mobile**: React Native + Expo + Gluestack UI
- **Frontend Web**: Next.js (landing page)
- **SDK**: TypeScript SDK para comunicación con API
- **Arquitectura**: Clean architecture con patrón exception-first y permisos basados en contexto

## Comandos de Desarrollo

### Configuración del Entorno
```bash
# Instalar dependencias (usar solo pnpm)
pnpm install

# Iniciar servicios Docker (PostgreSQL, Redis, MinIO)
pnpm run dev:docker

# Configurar environment
cp packages/api/.env.example packages/api/.env
# Editar .env con credenciales de Supabase
```

### Ejecutar la Aplicación
```bash
# Ejecutar todos los servicios en paralelo
pnpm run dev

# Ejecutar solo el servicio API
pnpm run dev:api

# Ejecutar app móvil
pnpm run dev:mobile

# Construir todos los paquetes
pnpm run build
```

### Gestión de Base de Datos (desde packages/api)
```bash
# Generar cliente Prisma
pnpm run prisma:generate

# Ejecutar migraciones
pnpm run prisma:migrate

# Desplegar migraciones a producción
pnpm run prisma:migrate:deploy

# Abrir Prisma Studio
pnpm run prisma:studio

# Resetear base de datos (CUIDADO: elimina todos los datos)
pnpm run prisma:reset

# Poblar base de datos
pnpm run prisma:seed
```

### Testing
```bash
# Ejecutar todas las pruebas
pnpm run test

# Ejecutar pruebas en modo watch
pnpm run test:watch

# Ejecutar pruebas con cobertura
pnpm run test:cov

# Debug de pruebas
pnpm run test:debug

# Ejecutar pruebas E2E
pnpm run test:e2e
```

### Calidad de Código
```bash
# Ejecutar linting
pnpm run lint

# Formatear código
pnpm run format

# Limpiar artifacts de build
pnpm run clean
```

## Arquitectura del Sistema

### Principios Arquitectónicos Fundamentales

1. **Patrón Exception-First**: Los servicios lanzan excepciones (BusinessException, ValidationException, ResourceNotFoundException, AuthorizationException), nunca devuelven objetos de error. El filtro global de excepciones maneja las respuestas HTTP.

2. **Patrón RequestContext**: Cada request tiene un RequestContext que contiene:
   - Información del usuario desde Supabase
   - Contexto del gimnasio actual desde header
   - Permisos computados
   - Instancia de cache

3. **Sistema de Permisos**: Permisos declarativos usando decorador @Allow() en controladores. PermissionGuard verifica contra permisos del rol del usuario.

4. **Multi-Tenancy**: Todos los datos están aislados por gimnasio. RequestContext.gymId controla todas las consultas. Completo aislamiento de datos entre gimnasios.

5. **Audit Trail**: Todas las entidades tienen campos created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at.

6. **Soft Delete**: No hay eliminaciones físicas. Todas las entidades usan timestamp deleted_at.

### Estructura de Módulos Backend

Cada módulo de dominio sigue este patrón:
```
modules/[domain]/
├── [domain].controller.ts    # Endpoints HTTP con decoradores @Allow()
├── [domain].module.ts        # Definición del módulo
├── [domain].service.ts       # Lógica de negocio (lanza excepciones)
├── dto/                      # DTOs con decoradores class-validator
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   └── index.ts
└── services/                 # Servicios adicionales si se necesitan
```

### Servicios y Patrones Clave

1. **PrismaService**: Abstracción de base de datos con filtrado automático por gimnasio
2. **CacheService**: Cache Redis con integración RequestContext
3. **PaginationService**: Paginación estandarizada en todos los endpoints de lista
4. **AuthService**: Integración Supabase para autenticación
5. **RequestContextService**: Crea y gestiona contexto de request

### Patrones de Esquema de Base de Datos

- Todas las tablas tienen campos de auditoría: created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at
- Foreign keys usan tipo UUID
- Enums definidos en esquema Prisma
- Campos JSON para datos flexibles (settings, metadata, features)

### Formato de Respuesta API

Respuestas exitosas siguen esta estructura:
```json
{
  "data": {},
  "meta": {}
}
```

Respuestas paginadas:
```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Enfoque de Testing

- Unit tests para servicios con dependencias mockeadas
- Integration tests para controladores con base de datos de test
- Mock RequestContext para testing
- Probar tanto escenarios de éxito como de excepción

## Tareas Comunes de Desarrollo

### Agregar un Nuevo Módulo (Backend)

1. Crear estructura del módulo bajo `src/modules/[domain]/`
2. Definir DTOs con decoradores de validación
3. Implementar servicio con patrón exception-first
4. Crear controlador con decoradores @Allow()
5. Agregar módulo a imports de app.module.ts
6. Crear tests para servicio y controlador

### Agregar una Nueva Entidad

1. Definir entidad en `prisma/schema.prisma`
2. Ejecutar `pnpm run prisma:generate`
3. Ejecutar `pnpm run prisma:migrate`
4. Crear módulo correspondiente siguiendo patrones anteriores

### Implementar Permisos

1. Agregar permiso al array de permisos del rol en base de datos
2. Usar @Allow(['PERMISSION_NAME']) en métodos del controlador
3. PermissionGuard valida automáticamente contra RequestContext

### Trabajar con RequestContext

```typescript
// En controladores
@Get()
@Allow([Permissions.CLIENTS_READ])
async findAll(@AppCtxt() context: IRequestContext) {
  return this.service.findAll(context);
}

// En servicios
async findAll(context: IRequestContext) {
  const gymId = context.getGymId();
  // Todas las consultas automáticamente filtradas por gymId
}
```

## Important Notes

- Never use relative imports - use absolute imports from 'src/'
- Always validate DTOs with class-validator decorators
- Use Prisma transactions for multi-step operations
- Cache keys should include gymId for proper isolation
- All file uploads go through centralized Assets module
- Swagger documentation auto-generated at /api/v1/docs

## Arquitectura Frontend - Principios y Patrones

### PRINCIPIOS FUNDAMENTALES

#### **Arquitectura Feature-First**
- **Siempre organizar por features**, no por capas técnicas
- Cada feature debe ser auto-contenido e independientemente testeable
- Features pueden importar de módulos shared, pero no de otros features directamente

#### **Filosofía de Tamaño de Componentes**
- **Mantener componentes pequeños y enfocados** - principio de responsabilidad única
- Si un componente excede 100-150 líneas, considerar dividirlo
- Extraer lógica compleja a custom hooks o átomos Jotai
- Preferir composición sobre componentes monolíticos grandes

#### **Análisis de Reusabilidad**
- **Antes de crear cualquier componente, preguntar: "¿Se usará en otro lugar?"**
- Si sí, colocar en shared/components
- Si no, mantener dentro del feature
- En caso de duda, empezar específico del feature y refactorizar a shared cuando sea necesario

### PATRÓN DE CONTROLADORES

#### **Definición**
Los controladores son el puente entre el SDK (API) y TanStack Query. Manejan fetching de datos, mutaciones y estrategias de caching.

#### **Estructura de Controlador**
```typescript
// features/clients/controllers/clients.controller.ts
export const useClientsController = () => {
  const { gymSpaceSDK } = useSDK();

  // Queries
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => gymSpaceSDK.clients.list(),
  });

  const clientQuery = (id: string) => useQuery({
    queryKey: ['clients', id],
    queryFn: () => gymSpaceSDK.clients.getById(id),
    enabled: !!id,
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: gymSpaceSDK.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    // Queries
    clients: clientsQuery.data,
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    
    // Individual client
    getClient: clientQuery,
    
    // Mutations
    createClient: createClientMutation.mutate,
    isCreating: createClientMutation.isPending,
  };
};
```

#### **Reglas de Controladores**
- **Un controlador por entidad de dominio** (clients, contracts, evaluations)
- **Exportar custom hooks**, no hooks raw de TanStack Query
- **Manejar estados de loading y errores** dentro del controlador
- **Gestionar invalidación de cache** en mutaciones
- **Mantener lógica de negocio fuera** - controladores solo manejan flujo de datos

### GESTIÓN DE ESTADO CON JOTAI

#### **Cuándo Usar Jotai**
- **Estado complejo de componente** que involucra múltiples piezas de datos
- **Comunicación cross-component** dentro de un feature
- **Gestión de estado de formularios** para formularios complejos
- **Estado UI** que necesita persistir a través de navegación
- **Cálculos de estado derivado**

#### **Patrón Jotai**
```typescript
// features/clients/stores/client-form.store.ts
export const clientFormAtom = atom({
  name: '',
  email: '',
  phone: '',
  birthDate: null as Date | null,
});

export const clientFormValidationAtom = atom((get) => {
  const form = get(clientFormAtom);
  return {
    isValid: form.name.length > 0 && form.email.includes('@'),
    errors: {
      name: form.name.length === 0 ? 'Name is required' : null,
      email: !form.email.includes('@') ? 'Invalid email' : null,
    },
  };
});

export const resetClientFormAtom = atom(null, (get, set) => {
  set(clientFormAtom, {
    name: '',
    email: '',
    phone: '',
    birthDate: null,
  });
});
```

#### **Reglas de Jotai**
- **Crear átomos por feature** en feature/stores/
- **Usar átomos derivados** para cálculos y validaciones
- **Mantener átomos enfocados** - una preocupación por átomo
- **Exportar átomos de lectura y escritura** cuando sea necesario
- **Evitar objetos complejos** - preferir estructura de estado plana

### GUÍAS DE COMPONENTES

#### **Límites de Tamaño de Componentes**
- **Máximo 150 líneas** por archivo de componente
- **Máximo 5 props** - si más, considerar dividir
- **Responsabilidad única** - un propósito principal por componente
- **Extraer cuando se reutilice** - si se usa en 2+ lugares, mover a shared/

#### **Estructura de Componente**
```typescript
// Bueno: Componente pequeño y enfocado
export const ClientCard = ({ client, onEdit }: ClientCardProps) => {
  const { deleteClient } = useClientsController();
  
  return (
    <Card>
      <ClientAvatar src={client.profileImage} />
      <ClientInfo name={client.name} phone={client.phone} />
      <ClientActions onEdit={onEdit} onDelete={() => deleteClient(client.id)} />
    </Card>
  );
};

// Mejor: Extraer sub-componentes
const ClientAvatar = ({ src }: { src?: string }) => (
  <Avatar src={src} fallback="CL" />
);

const ClientInfo = ({ name, phone }: { name: string; phone: string }) => (
  <div>
    <h3>{name}</h3>
    <p>{phone}</p>
  </div>
);

const ClientActions = ({ onEdit, onDelete }: ClientActionsProps) => (
  <div>
    <Button onClick={onEdit}>Edit</Button>
    <Button variant="destructive" onClick={onDelete}>Delete</Button>
  </div>
);
```

#### **Reglas de Componentes**
- **Props deben ser explícitas** - evitar pasar objetos enteros cuando solo se necesitan pocos campos
- **Usar interfaces TypeScript** para props
- **Manejar estados de loading y error** en componentes de datos
- **Separar presentación de lógica** - usar controladores y hooks

### CHECKLIST DE REUSABILIDAD Y PATRÓN DE MÓDULO FEATURE

#### **Antes de Crear un Componente**
1. **¿Se usa en múltiples lugares?** → Mover a shared/components
2. **¿Es específico del feature pero reutilizable dentro del feature?** → Mantener en feature/components
3. **¿Contiene lógica compleja?** → Extraer a hooks o átomos Jotai
4. **¿Es puramente presentacional?** → Considerar hacer un componente UI shared

#### **Indicadores de Reusabilidad**
- **Patrones UI** (cards, forms, buttons) → shared/components
- **Lógica de negocio** (cálculos, validaciones) → shared/utils o feature/helpers
- **Patrones de fetching de datos** → shared/hooks
- **Gestión de estado** (estado app-wide) → shared/stores

#### **API Pública del Feature**
```typescript
// features/clients/index.ts
export { ClientsList } from './components/ClientsList';
export { ClientForm } from './components/ClientForm';
export { useClientsController } from './controllers/clients.controller';
export type { Client, CreateClientData } from './types';

// No exportar componentes internos, helpers, o stores
```

#### **Reglas del Feature**
- **Exportar solo lo necesario** por otros features o app
- **Mantener implementación interna privada**
- **Proporcionar tipos TypeScript claros** para items exportados
- **Documentar la API pública** cuando sea compleja

### WORKFLOW DE DESARROLLO

#### **Al Construir un Nuevo Feature**
1. **Empezar con el controlador** - definir necesidades de datos
2. **Crear componentes pequeños** - construir UI pieza por pieza
3. **Extraer lógica a Jotai** cuando el estado se vuelva complejo
4. **Identificar partes reutilizables** y mover a shared/
5. **Escribir tests** para componentes reutilizables y controladores
6. **Documentar la API pública** en feature/index.ts

#### **Guías de Refactoring**
- **Cuando un componente excede 150 líneas** → Dividir en componentes más pequeños
- **Cuando la lógica se repite** → Extraer a utilidades shared
- **Cuando la gestión de estado se vuelve compleja** → Usar átomos Jotai
- **Cuando un componente se usa en otro lugar** → Mover a shared/

#### **Checklist de Code Review**
- [ ] Componentes están enfocados y bajo 150 líneas
- [ ] Controladores manejan flujo de datos correctamente
- [ ] Jotai se usa para estado complejo, no estado simple de componente
- [ ] Partes reutilizables están identificadas y extraídas
- [ ] Tipos TypeScript están definidos apropiadamente
- [ ] Tests cubren los paths críticos

### ANTI-PATRONES A EVITAR

#### **No Hacer Esto**
- ❌ **Prop drilling** - usar Jotai para estado complejo
- ❌ **Componentes monolíticos** - dividir en piezas más pequeñas
- ❌ **Llamadas directas al SDK en componentes** - usar controladores
- ❌ **Imports feature-to-feature** - usar shared/ o refactorizar
- ❌ **Lógica compleja en JSX** - extraer a hooks o helpers
- ❌ **Código duplicado** - identificar y extraer a utilidades shared

#### **Hacer Esto En Su Lugar**
- ✅ **Usar controladores** para operaciones de datos
- ✅ **Componer componentes pequeños** para UI compleja
- ✅ **Extraer lógica reutilizable** a módulos shared
- ✅ **Usar átomos Jotai** para estado cross-component
- ✅ **Tipear todo** con TypeScript
- ✅ **Probar en aislamiento** donde sea posible

**Recordar: Favorecer composición sobre complejidad, y reutilización sobre repetición.**

## Special Reminders

- Always use `docs/backend-architecture.md` and `docs/use-cases-and-entities.md` as reference for understanding the project's architectural decisions and domain models
- Always use pnpm for package management
- Follow the exception-first pattern - services throw exceptions, never return errors
- Use RequestContext for all gym-scoped operations
- All endpoints require @Allow() decorator for permissions
- The project uses Prisma's soft delete middleware - all entities have deletedAt field
- Authentication is handled by Supabase - users don't have passwords in the database
- Use lowercase enum values in TypeScript code (e.g., 'active' not 'ACTIVE') to match Prisma schema
- Contract relates to Gym through gymClient relationship, not directly
- Always generate client numbers for new gym clients using timestamp pattern
- Use `as any` for Fastify plugin type conflicts in main.ts
- When fixing field references, check Prisma schema for exact field names
- Always read SDK documentation before implement a query or mutation
- Always use the wrapper ui fields to implement a form
- Always take a look to the case studies before add a new feature
- not use space property, use tailwind classes
- not use size property, use nativewind features instead

## Patrones de Importación y Desarrollo

### **Estrategia de Alias de Importación**
- **SIEMPRE usar alias `@/`** para imports internos
- Seguir estos patrones:
  - `@/components/ui/[component-name]` para componentes UI
  - `@/features/[feature-name]` para features
  - `@/shared/[category]` para utilidades
- Usar keyword `type` para imports de tipos TypeScript

**Ejemplo**:
```typescript
// ✅ CORRECTO
import { Button, ButtonGroup } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/features/clients";
import type { Client } from "@/shared/types";

// ❌ INCORRECTO
import { Button } from "../../../components/ui/button";
import { Button } from "components/ui/button";
```

### **Estrategia de Testing**
- **Unit test componentes shared** individualmente
- **Integration test features** como flujos completos
- **Test controladores** con respuestas SDK mockeadas
- **Test átomos Jotai** en aislamiento

## Recordatorios Especiales y Reglas de Desarrollo

### **Reglas Arquitectónicas Importantes**
- Siempre usar `docs/backend-architecture.md` y `docs/use-cases-and-entities.md` como referencia para entender las decisiones arquitectónicas del proyecto y modelos de dominio
- Siempre usar pnpm para gestión de paquetes
- Seguir el patrón exception-first - servicios lanzan excepciones, nunca devuelven errores
- Usar RequestContext para todas las operaciones con scope de gimnasio
- Todos los endpoints requieren decorador @Allow() para permisos
- El proyecto usa middleware de soft delete de Prisma - todas las entidades tienen campo deletedAt
- La autenticación es manejada por Supabase - usuarios no tienen passwords en la base de datos
- Usar valores enum en lowercase en código TypeScript (ej. 'active' no 'ACTIVE') para coincidir con esquema Prisma
- Contract se relaciona con Gym a través de relación gymClient, no directamente
- Siempre generar números de cliente para nuevos gym clients usando patrón timestamp
- Usar `as any` para conflictos de tipos de plugins Fastify en main.ts
- Al arreglar referencias de campos, verificar esquema Prisma para nombres exactos de campos

### **Reglas de Desarrollo Frontend**
- Siempre leer documentación del SDK antes de implementar un query o mutation
- Siempre usar los wrapper ui fields para implementar un formulario
- Siempre echar un vistazo a los casos de estudio antes de agregar una nueva feature
- No usar propiedad space, usar clases tailwind
- No usar propiedad size, usar features de nativewind en su lugar

### **Estrategia de Linting**
- Siempre ejecutar linting antes de hacer commit del código
- `not run lint`: Esto indica una instrucción específica para omitir verificaciones de linting, que debe usarse con moderación y precaución

### **Workflows de Desarrollo**
- **Usar VSCode MCP para conocer sobre los errores**

## Notas Importantes

- Nunca usar imports relativos - usar imports absolutos desde 'src/'
- Siempre validar DTOs con decoradores class-validator
- Usar transacciones Prisma para operaciones multi-paso
- Claves de cache deben incluir gymId para aislamiento apropiado
- Todas las subidas de archivos van a través del módulo Assets centralizado
- Documentación Swagger auto-generada en /api/v1/docs

## Guía de Componentes UI (App Móvil)

La app móvil usa componentes Gluestack UI ubicados en `/packages/mobile/src/components/ui/`. Estos componentes proporcionan un sistema de diseño consistente:

### Componentes UI Disponibles

#### **Layout y Estructura**
- `box/` - Componente contenedor para layout
- `center/` - Componente wrapper para centrar
- `grid/` - Sistema de layout grid
- `hstack/` - Layout stack horizontal
- `vstack/` - Layout stack vertical
- `divider/` - Elemento separador visual

#### **Navegación e Interacción**
- `button/` - Botones de interacción primarios
- `fab/` - Botón de acción flotante
- `pressable/` - Componente wrapper táctil
- `link/` - Enlaces de navegación
- `menu/` - Sistema de menú dropdown

#### **Visualización de Datos**
- `card/` - Contenedor de contenido con estilo
- `text/` - Componente de tipografía
- `heading/` - Texto de título y encabezado
- `image/` - Componente de visualización de imagen
- `image-background/` - Wrapper de imagen de fondo
- `avatar/` - Imágenes de perfil de usuario
- `badge/` - Indicadores de estado
- `table/` - Visualización de tabla de datos

#### **Controles de Formulario**
- `input/` - Campos de entrada de texto
- `textarea/` - Entrada de texto multi-línea
- `checkbox/` - Checkboxes de selección
- `radio/` - Selección de botón radio
- `switch/` - Switches de toggle
- `select/` - Selección dropdown
- `slider/` - Entrada slider de rango
- `form-control/` - Wrapper de campo de formulario

#### **Feedback y Estado**
- `alert/` - Mensajes de notificación
- `toast/` - Notificaciones temporales
- `progress/` - Indicadores de progreso
- `spinner/` - Indicadores de carga
- `skeleton/` - Placeholders de carga

#### **Overlays y Modales**
- `modal/` - Diálogos modales
- `alert-dialog/` - Diálogos de confirmación
- `actionsheet/` - Acciones bottom sheet
- `drawer/` - Drawer de navegación lateral
- `popover/` - Popups contextuales
- `tooltip/` - Hints útiles
- `portal/` - Render a diferente ubicación DOM

#### **Listas y Datos**
- `flat-list/` - Renderizado optimizado de listas
- `section-list/` - Visualización de lista por secciones
- `virtualized-list/` - Listas optimizadas para rendimiento
- `scroll-view/` - Área de contenido scrolleable
- `refresh-control/` - Funcionalidad pull-to-refresh

#### **Utilidades de Layout**
- `accordion/` - Secciones de contenido plegables
- `safe-area-view/` - Manejo de safe area
- `keyboard-avoiding-view/` - Layouts conscientes del teclado
- `input-accessory-view/` - Accesorios de input
- `status-bar/` - Configuración de status bar
- `view/` - Contenedor view básico

#### **Sistema y Provider**
- `gluestack-ui-provider/` - Provider de tema y configuración
- `utils/` - Funciones utilitarias y helpers

### Ejemplos de Uso

```typescript
// ✅ Componentes de Layout
import { VStack, HStack, Box } from "@/components/ui/vstack";
import { Card, CardContent } from "@/components/ui/card";

// ✅ Componentes de Formulario
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel } from "@/components/ui/form-control";

// ✅ Componentes de Feedback
import { Alert, AlertText } from "@/components/ui/alert";
import { Toast, ToastTitle } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
```

### Guías de Componentes

- **Siempre usar componentes Gluestack UI** en lugar de implementaciones custom
- **Seguir la jerarquía de componentes** (ej. InputField dentro de Input)
- **Usar VStack/HStack** para layouts en lugar de flexbox directamente
- **Implementar spacing apropiado** usando componente Box con padding/margin
- **Usar FormControl** para todas las implementaciones de campos de formulario
- **Manejar estados de loading** con componentes Spinner o Skeleton

## Development Reminders

- **Linting Strategy**:
  - Always run linting before committing code
  - not run lint: This indicates a specific instruction to skip linting checks, which should be used sparingly and with caution

## Dev Workflows

- **Use VSCode MCP to know about the errors**