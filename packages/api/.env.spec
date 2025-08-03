# Minimal environment for OpenAPI generation
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database - using a placeholder for spec generation
DATABASE_URL="postgresql://user:pass@localhost:5432/gymspace"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase - using placeholders for spec generation
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=gymspace
S3_SECRET_KEY=gymspace123
S3_BUCKET_NAME=gymspace

# JWT
JWT_SECRET=your-jwt-secret-key-for-spec-generation
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3001
