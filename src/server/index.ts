import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ticketRoutes from './routes/ticketRoutes.js';
import { config } from './config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.NODE_ENV === 'development' ? 'http://localhost:5175' : null,  // development
  process.env.NODE_ENV === 'development' ? 'http://localhost:5176' : null,  // alternatieve development poort
  process.env.FRONTEND_URL || 'https://ticket-analyser.vercel.app', // production frontend URL
  process.env.CLIENT_URL || 'https://ticket-analyser.vercel.app' // production
].filter(Boolean); // Filter null/undefined waarden

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ticket-analyser.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Verhoog de limiet voor JSON payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Start de server direct, ongeacht databaseverbinding
const server = app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});

// Consistente MongoDB connectie methode
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI niet ingesteld, database wordt niet verbonden');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB verbonden');
  } catch (error) {
    console.error('MongoDB connectie fout:', error);
    // Blijf proberen elke 5 seconden
    setTimeout(connectDB, 5000);
  }
};

// Start connectie proces
connectDB();

// Routes
app.use('/api/tickets', ticketRoutes);

// Test route om te controleren of de server draait
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    mongoConnected: mongoose.connection.readyState === 1,
    database: {
      uri: process.env.MONGODB_URI ? `mongodb+srv://*****:*****@${process.env.MONGODB_URI.split('@')[1]}` : 'niet ingesteld',
      status: mongoose.connection.readyState
    }
  });
});

// Diagnostische route voor MongoDB
app.get('/api/diagnostics/db', async (req, res) => {
  try {
    // Importeer de os module op een manier die werkt met ES modules
    const os = await import('os');
    
    const diagnostics = {
      connectionString: process.env.MONGODB_URI ? `mongodb+srv://*****:*****@${process.env.MONGODB_URI.split('@')[1]}` : 'niet ingesteld',
      connectionStatus: mongoose.connection.readyState,
      hostInfo: null,
      connectionError: null,
      networkInfo: {
        // Haal netwerk interfaces op
        networkInterfaces: Object.entries(os.networkInterfaces() || {})
          .map(([name, interfaces]) => ({
            name,
            addresses: (interfaces || []).map(iface => ({
              address: iface.address,
              family: iface.family,
              internal: iface.internal
            }))
          }))
      },
      lastError: mongoose.connection.db ? (mongoose.connection as any).error?.message : null
    };

    // Probeer basis MongoDB commando's uit te voeren als we verbonden zijn
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const result = await mongoose.connection.db.admin().ping();
        const serverInfo = await mongoose.connection.db.admin().serverInfo();
        diagnostics.hostInfo = serverInfo as any;
        // @ts-ignore
        diagnostics.pingResult = result;
      } catch (cmdError: any) {
        // @ts-ignore
        diagnostics.commandError = {
          message: cmdError.message,
          code: cmdError.code
        };
      }
    }

    res.json(diagnostics);
  } catch (error: any) {
    res.status(500).json({
      error: 'Diagnostische fout',
      details: error.message
    });
  }
});

// Mongoose connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, trying to reconnect...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI);
  }, 5000);
}); 