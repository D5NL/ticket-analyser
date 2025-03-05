declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      PORT: string;
      CORS_ORIGIN: string;
    }
  }
}

export {}; 