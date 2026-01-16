declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BCRYPT_HASH: string;
      JWT_SECRET: string;
      DB_URL: string;
      DB_NAME: string;
      APP_NAME: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      CACHE_HOST: string;
      CACHE_PORT: string;
      MAILER_USERNAME: string;
      MAILER_PASSWORD: string;
      REDIS_PASSWORD: string;
      CLOUD_REDIS_HOST: string;
      CLOUD_REDIS_PORT: string;
      CLOUD_REDIS_PASSWORD: string;
    }
  }
}

export {};
