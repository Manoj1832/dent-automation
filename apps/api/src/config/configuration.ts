export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dentflow-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  },
});
