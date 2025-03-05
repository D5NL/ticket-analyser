export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://...',
  port: process.env.PORT || 3000,
  clientUrl: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL || 'https://jouw-domain.vercel.app')
    : 'http://localhost:5175',
  nodeEnv: process.env.NODE_ENV || 'development'
}; 