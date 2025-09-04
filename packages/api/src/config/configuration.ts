export default () => ({
  // Application
  app: {
    baseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || '5200'}`,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT || '5200', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10', 10), // Reduced from 25 to 10 to force better practices
    poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10), // Reduced from 20 to 10
    connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '5', 10), // Reduced from 10 to 5
    socketTimeout: parseInt(process.env.DATABASE_SOCKET_TIMEOUT || '10', 10), // Reduced from 30 to 10
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6376',
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // S3/MinIO
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'gymspace',
    secretKey: process.env.S3_SECRET_KEY || 'gymspace123',
    bucket: process.env.S3_BUCKET || 'gymspace-assets',
    region: process.env.S3_REGION || 'us-east-1',
    useSsl: process.env.S3_USE_SSL === 'true',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  // Email (Resend)
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'GymSpace <gymspace@theelena.me>',
  },

  // Rate limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
});
