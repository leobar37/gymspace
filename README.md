# GymSpace - Gym Management System

A comprehensive gym management system built with NestJS, PostgreSQL, and modern web technologies.

## 🚀 Tech Stack

- **Backend**: NestJS with Fastify adapter
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: Supabase Auth
- **File Storage**: AWS S3 / MinIO (local)
- **API Documentation**: Swagger/OpenAPI
- **Package Manager**: pnpm (monorepo)

## 📁 Project Structure

```
gymspace/
├── packages/
│   ├── api/         # NestJS Backend API
│   ├── mobile/      # React Native/Expo Mobile App
│   ├── sdk/         # TypeScript SDK
│   └── shared/      # Shared types and interfaces
├── docker/          # Docker configuration
├── docs/            # Architecture documentation
└── tools/           # Build tools and scripts
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd gymspace
```

2. Install dependencies
```bash
pnpm install
```

3. Copy environment variables
```bash
cp packages/api/.env.example packages/api/.env
```

4. Update `.env` with your configuration:
- Database credentials
- Supabase keys
- S3/MinIO settings

5. Start Docker services
```bash
pnpm run dev:docker
```

6. Run database migrations
```bash
cd packages/api
pnpm run prisma:migrate
```

7. Start the development server
```bash
pnpm run dev
```

The API will be available at `http://localhost:3000/api/v1`
Swagger documentation at `http://localhost:3000/api/v1/docs`

## 📝 Available Scripts

- `pnpm run dev` - Start all services in development mode
- `pnpm run dev:api` - Start only the API service
- `pnpm run dev:docker` - Start Docker services (PostgreSQL, Redis, MinIO)
- `pnpm run build` - Build all packages
- `pnpm run test` - Run tests
- `pnpm run lint` - Run linting
- `pnpm run format` - Format code with Prettier

## 🏗️ Architecture

The system follows a clean architecture pattern with:

- **Exception-First**: Services throw exceptions, no error returns
- **Context-Aware**: Request context drives permissions and data access
- **Multi-tenant**: Complete data isolation between gyms
- **Audit Trail**: All operations are tracked with user information
- **Soft Delete**: No physical deletion, all records have deleted_at

### Core Components

1. **RequestContext**: Manages user, gym, and permission context
2. **Permission System**: Declarative permission-based access control
3. **Exception Handling**: Global exception filter with standardized responses
4. **Cache Layer**: Redis caching for performance
5. **Pagination**: Standardized pagination across all endpoints

## 🔐 Security

- JWT authentication via Supabase
- Role-based access control (RBAC)
- Gym-scoped data access
- Input validation with class-validator
- SQL injection prevention via Prisma
- Rate limiting per endpoint

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api/v1/docs`
- OpenAPI JSON: `http://localhost:3000/api/v1/docs-json`

## 📱 Mobile App Configuration

The mobile app uses environment variables for configuration. Set up your API endpoint:

1. Copy the example file:
```bash
cp packages/mobile/.env.example packages/mobile/.env
```

2. Configure the API URL in your `.env` file:
```bash
# For local development (replace with your machine's IP)
API_URL=http://192.168.100.18:5200/api/v1

# Or for production
# API_URL=https://api.yourapp.com/api/v1
```

3. Environment-specific files:
   - `.env.development` - Local development settings
   - `.env.production` - Production build settings
   - `.env` - Default fallback values

4. Start the mobile app:
```bash
pnpm --filter @gymspace/mobile run start
```

### CI/CD Configuration

For EAS builds or CI environments, provide the `API_URL` environment variable:

```bash
# EAS build
eas build --profile production --non-interactive

# GitHub Actions example
env:
  API_URL: ${{ secrets.PRODUCTION_API_URL }}
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT