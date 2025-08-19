import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis - supports either REDIS_URL or individual host/port/password
  REDIS_URL: Joi.string().uri({ scheme: ['redis'] }).optional(),
  REDIS_HOST: Joi.string().when('REDIS_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.string().default('localhost'),
  }),
  REDIS_PORT: Joi.number().when('REDIS_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.number().default(6379),
  }),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Supabase
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_KEY: Joi.string().required(),

  // S3/MinIO
  S3_ENDPOINT: Joi.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('gymspace-assets'),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_USE_SSL: Joi.boolean().default(false),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),

  // Rate limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
