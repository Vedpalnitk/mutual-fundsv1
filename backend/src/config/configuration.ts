export default () => ({
  port: parseInt(process.env.PORT ?? '3501', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePoolSize: parseInt(process.env.DATABASE_POOL_SIZE || '25', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    cacheHost: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST || 'localhost',
    cachePort: parseInt(process.env.REDIS_CACHE_PORT ?? process.env.REDIS_PORT ?? '6379', 10),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'ml-models',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mlService: {
    url: process.env.ML_SERVICE_URL || 'localhost:3503',
    httpUrl: process.env.ML_SERVICE_HTTP_URL || 'http://localhost:8000',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@sparrow-invest.com',
  },
  whatsapp: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
  },
  bse: {
    encryptionKey: process.env.BSE_ENCRYPTION_KEY || '',
    mockMode: process.env.BSE_MOCK_MODE === 'true',
    baseUrl: process.env.BSE_BASE_URL || 'https://bsestarmfdemo.bseindia.com',
    callbackUrl: process.env.BSE_CALLBACK_URL || 'http://localhost:3801/api/v1/bse/payments/callback',
    callbackSecret: process.env.BSE_CALLBACK_SECRET || '',
  },
  nmf: {
    encryptionKey: process.env.NMF_ENCRYPTION_KEY || '',
    mockMode: process.env.NMF_MOCK_MODE === 'true',
    baseUrl: process.env.NMF_BASE_URL || 'https://nseinvestuat.nseindia.com',
    callbackUrl: process.env.NMF_CALLBACK_URL || 'http://localhost:3801/api/v1/nmf/payments/callback',
    callbackSecret: process.env.NMF_CALLBACK_SECRET || '',
  },
  pan: {
    encryptionKey: process.env.PAN_ENCRYPTION_KEY || '',
  },
});
