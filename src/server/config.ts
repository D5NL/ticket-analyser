export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketdb',
  port: process.env.PORT || 3000,
  clientUrl: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://ticket-analyser.vercel.app')
    : 'http://localhost:5175',
  nodeEnv: process.env.NODE_ENV || 'development'
}; 