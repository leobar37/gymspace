# CLAUDE_PROJECT.md - GymSpace API Development Guide

This file provides comprehensive guidance for Claude Code when working with the GymSpace API codebase.

## Project Context

GymSpace is a multi-tenant SaaS platform for gym management. The API serves as the backend for web and mobile applications, handling everything from user authentication to contract management, physical evaluations, and gym operations.

## Technical Stack

- **Framework**: NestJS 10.x with Fastify adapter
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7 with cache-manager
- **Authentication**: Supabase Auth (JWT-based)
- **File Storage**: AWS S3 (MinIO for local development)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit/integration tests

## Core Architectural Patterns

### 1. Exception-First Pattern
```typescript
// ❌ NEVER DO THIS
async findClient(id: string): Promise<{ error?: string; data?: Client }> {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return { error: 'Client not found' };
  }
  return { data: client };
}

// ✅ ALWAYS DO THIS
async findClient(id: string, context: IRequestContext): Promise<Client> {
  const client = await this.prisma.client.findUnique({
    where: { 
      id,
      gymId: context.getGymId(),
      deletedAt: null
    }
  });
  
  if (!client) {
    throw new ResourceNotFoundException('Client not found');
  }
  
  return client;
}
```

### 2. RequestContext Pattern
Every service method receives a RequestContext containing:
- User information
- Current gym context
- Permissions
- Scoped cache instance

```typescript
// Controller
@Get(':id')
@Allow(['CLIENTS_READ'])
async findOne(
  @Param('id') id: string,
  @RequestContext() context: IRequestContext
) {
  return this.service.findOne(id, context);
}

// Service
async findOne(id: string, context: IRequestContext) {
  const gymId = context.getGymId(); // Automatic gym scoping
  const userId = context.getUserId(); // Audit trail
  
  // All queries filtered by gymId
  return this.prisma.client.findUnique({
    where: { id, gymId }
  });
}
```

### 3. Permission System
Declarative permissions using decorators:

```typescript
@Post()
@Allow(['CONTRACTS_CREATE']) // Single permission
async create(@Body() dto: CreateContractDto) { }

@Put(':id')
@Allow(['CONTRACTS_UPDATE', 'CONTRACTS_MANAGE']) // Multiple permissions (OR)
async update(@Param('id') id: string) { }

@Delete(':id')
@Allow(['CONTRACTS_DELETE']) // Specific permission
async remove(@Param('id') id: string) { }
```

### 4. Multi-Tenancy
All data is gym-scoped:

```typescript
// Automatic gym filtering in queries
const clients = await this.prisma.gymClient.findMany({
  where: {
    gymId: context.getGymId(), // ALWAYS include
    status: 'active'
  }
});

// Creating records with gym association
const contract = await this.prisma.contract.create({
  data: {
    ...dto,
    gymClientId: client.id, // Contract linked via GymClient
    createdByUserId: context.getUserId(),
    updatedByUserId: context.getUserId()
  }
});
```

## Module Development Patterns

### Standard Module Structure
```
src/modules/[domain]/
├── [domain].controller.ts      # HTTP endpoints
├── [domain].service.ts         # Business logic
├── [domain].module.ts          # Module definition
├── dto/                        # Data Transfer Objects
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   ├── search-[entity].dto.ts
│   └── index.ts
└── services/                   # Additional services (optional)
    └── [domain]-helper.service.ts
```

### Controller Pattern
```typescript
@Controller('clients')
@ApiTags('Clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  @Allow(['CLIENTS_CREATE'])
  @ApiOperation({ summary: 'Create a new client' })
  async create(
    @Body() dto: CreateClientDto,
    @RequestContext() context: IRequestContext
  ) {
    return this.service.create(dto, context);
  }

  @Get()
  @Allow(['CLIENTS_READ'])
  @ApiPaginatedResponse(ClientDto)
  async findAll(
    @Query() query: SearchClientsDto,
    @RequestContext() context: IRequestContext
  ) {
    return this.service.findAll(query, context);
  }
}
```

### Service Pattern
```typescript
@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly pagination: PaginationService
  ) {}

  async create(dto: CreateClientDto, context: IRequestContext) {
    // Validate business rules
    await this.validateClientData(dto, context);

    // Create with audit fields
    const client = await this.prisma.gymClient.create({
      data: {
        ...dto,
        gymId: context.getGymId(),
        clientNumber: this.generateClientNumber(),
        createdByUserId: context.getUserId(),
        updatedByUserId: context.getUserId()
      }
    });

    // Invalidate cache
    await this.cache.del(`gym:${context.getGymId()}:clients:*`);

    return client;
  }

  private async validateClientData(dto: CreateClientDto, context: IRequestContext) {
    // Check for duplicate email within gym
    const existing = await this.prisma.gymClient.findFirst({
      where: {
        email: dto.email,
        gymId: context.getGymId(),
        deletedAt: null
      }
    });

    if (existing) {
      throw new BusinessException('Client with this email already exists');
    }
  }
}
```

### DTO Pattern
```typescript
export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Client full name' })
  name: string;

  @IsEmail()
  @ApiProperty({ description: 'Client email address' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Client phone number', required: false })
  phone?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Client birth date', required: false })
  birthDate?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ description: 'Profile image asset ID', required: false })
  profileImageId?: string;
}
```

## Database Patterns

### Prisma Schema Conventions
```prisma
model GymClient {
  id                String    @id @default(uuid())
  gymId             String    @map("gym_id")
  clientNumber      String    @map("client_number")
  name              String
  email             String
  phone             String?
  birthDate         DateTime? @map("birth_date")
  status            ClientStatus @default(active)
  
  // Relationships
  gym               Gym       @relation(fields: [gymId], references: [id])
  contracts         Contract[]
  evaluations       Evaluation[]
  checkIns          CheckIn[]
  
  // Audit fields
  createdByUserId   String    @map("created_by_user_id")
  updatedByUserId   String    @map("updated_by_user_id")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")
  
  @@unique([gymId, clientNumber])
  @@map("gym_clients")
}
```

### Query Patterns
```typescript
// Always include gym filtering
const result = await this.prisma.contract.findMany({
  where: {
    gymClient: {
      gymId: context.getGymId() // Filter by gym through relation
    },
    status: 'active',
    deletedAt: null // Soft delete check
  },
  include: {
    gymClient: true,
    membershipPlan: true
  }
});

// Use transactions for multi-step operations
const result = await this.prisma.$transaction(async (tx) => {
  // Create contract
  const contract = await tx.contract.create({ data: contractData });
  
  // Update client status
  await tx.gymClient.update({
    where: { id: clientId },
    data: { status: 'active' }
  });
  
  return contract;
});
```

## Common Development Tasks

### Adding a New Module

1. **Create module structure**:
```bash
mkdir -p src/modules/new-feature/dto
touch src/modules/new-feature/new-feature.module.ts
touch src/modules/new-feature/new-feature.controller.ts
touch src/modules/new-feature/new-feature.service.ts
```

2. **Define the module**:
```typescript
@Module({
  imports: [CommonModule],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
  exports: [NewFeatureService]
})
export class NewFeatureModule {}
```

3. **Add to AppModule**:
```typescript
@Module({
  imports: [
    // ... other modules
    NewFeatureModule
  ]
})
export class AppModule {}
```

### Implementing CRUD Operations

```typescript
// Standard CRUD service methods
async create(dto: CreateDto, context: IRequestContext): Promise<Entity> {
  // Validate
  // Create with audit fields
  // Invalidate cache
  // Return created entity
}

async findAll(query: SearchDto, context: IRequestContext): Promise<PaginatedResult<Entity>> {
  // Build where clause with gym filter
  // Apply pagination
  // Return paginated results
}

async findOne(id: string, context: IRequestContext): Promise<Entity> {
  // Find by id and gymId
  // Throw if not found
  // Return entity
}

async update(id: string, dto: UpdateDto, context: IRequestContext): Promise<Entity> {
  // Find existing
  // Validate changes
  // Update with audit fields
  // Invalidate cache
  // Return updated entity
}

async remove(id: string, context: IRequestContext): Promise<void> {
  // Find existing
  // Soft delete (set deletedAt)
  // Invalidate cache
}
```

### Working with Assets

All file uploads go through the Assets module:

```typescript
// In controller
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadProfileImage(
  @UploadedFile() file: FastifyFile,
  @RequestContext() context: IRequestContext
) {
  const asset = await this.assetsService.upload(file, context);
  return { assetId: asset.id };
}

// Reference asset in other entities
await this.prisma.gymClient.update({
  where: { id: clientId },
  data: { profileImageId: asset.id }
});
```

### Implementing Pagination

```typescript
async findAll(query: SearchClientsDto, context: IRequestContext) {
  const where = {
    gymId: context.getGymId(),
    deletedAt: null,
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ]
    }),
    ...(query.status && { status: query.status })
  };

  const { data, meta } = await this.pagination.paginate(
    this.prisma.gymClient,
    {
      where,
      orderBy: { createdAt: 'desc' },
      include: { contracts: true }
    },
    {
      page: query.page,
      limit: query.limit
    }
  );

  return { data, meta };
}
```

### Cache Patterns

```typescript
// Cache key conventions
const cacheKey = `gym:${gymId}:clients:${clientId}`;
const listCacheKey = `gym:${gymId}:clients:list:${page}`;

// Get with cache
async findOne(id: string, context: IRequestContext) {
  const cacheKey = `gym:${context.getGymId()}:client:${id}`;
  
  // Try cache first
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;
  
  // Get from database
  const client = await this.prisma.gymClient.findUnique({
    where: { id, gymId: context.getGymId() }
  });
  
  if (!client) {
    throw new ResourceNotFoundException('Client not found');
  }
  
  // Cache for 30 minutes
  await this.cache.set(cacheKey, client, 1800);
  
  return client;
}

// Invalidate on mutation
async update(id: string, dto: UpdateDto, context: IRequestContext) {
  const result = await this.prisma.gymClient.update({ ... });
  
  // Invalidate specific and list caches
  await this.cache.del(`gym:${context.getGymId()}:client:${id}`);
  await this.cache.del(`gym:${context.getGymId()}:clients:list:*`);
  
  return result;
}
```

## Testing Guidelines

### Unit Test Pattern
```typescript
describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: DeepMockProxy<PrismaClient>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClientsService,
        mockPrismaService,
        mockCacheService,
        mockPaginationService
      ]
    }).compile();
    
    service = module.get(ClientsService);
    prisma = module.get(PrismaService);
  });
  
  describe('create', () => {
    it('should create a client', async () => {
      const dto = { name: 'John Doe', email: 'john@example.com' };
      const context = createMockContext({ gymId: 'gym-1' });
      
      prisma.gymClient.findFirst.mockResolvedValue(null);
      prisma.gymClient.create.mockResolvedValue(mockClient);
      
      const result = await service.create(dto, context);
      
      expect(result).toEqual(mockClient);
      expect(prisma.gymClient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          gymId: 'gym-1',
          name: 'John Doe',
          email: 'john@example.com'
        })
      });
    });
    
    it('should throw on duplicate email', async () => {
      prisma.gymClient.findFirst.mockResolvedValue(mockClient);
      
      await expect(service.create(dto, context))
        .rejects.toThrow(BusinessException);
    });
  });
});
```

### Integration Test Pattern
```typescript
describe('ClientsController (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = module.createNestApplication();
    await app.init();
  });
  
  it('/clients (POST)', () => {
    return request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Gym-Id', 'gym-1')
      .send({ name: 'John Doe', email: 'john@example.com' })
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('John Doe');
      });
  });
});
```

## Common Pitfalls to Avoid

1. **Never skip RequestContext** - All service methods need context for gym scoping
2. **Always check soft deletes** - Include `deletedAt: null` in queries
3. **Don't return errors** - Throw exceptions that the global filter handles
4. **Include audit fields** - Set createdByUserId and updatedByUserId
5. **Validate gym ownership** - Ensure resources belong to the current gym
6. **Use transactions** - For operations affecting multiple entities
7. **Invalidate cache** - After any mutation operation
8. **Check permissions** - Use @Allow() decorator on all endpoints

## Debugging Tips

1. **Enable Prisma query logging**:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});
```

2. **Check RequestContext**:
```typescript
console.log('Current gym:', context.getGymId());
console.log('Current user:', context.getUserId());
console.log('Permissions:', context.permissions);
```

3. **Verify cache operations**:
```typescript
const cached = await this.cache.get(key);
console.log('Cache hit:', !!cached);
```

## API Documentation

- Swagger UI: `http://localhost:3000/api/v1/docs`
- OpenAPI JSON: `http://localhost:3000/api/v1/docs-json`
- All DTOs automatically documented
- Use @ApiOperation() for endpoint descriptions
- Use @ApiProperty() for field descriptions

## Environment Variables

Key environment variables in `.env`:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/gymspace
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=gymspace-assets
JWT_SECRET=your-jwt-secret
```

## Useful Commands Summary

```bash
# Development
pnpm run dev                 # Start with hot reload
pnpm run build              # Build for production

# Database
pnpm run prisma:generate    # Update Prisma client
pnpm run prisma:migrate     # Run migrations
pnpm run prisma:studio      # Open database GUI

# Testing
pnpm run test              # Run unit tests
pnpm run test:e2e          # Run integration tests
pnpm run test:cov          # Generate coverage report

# Code Quality
pnpm run lint              # Check code style
pnpm run format            # Format code
```