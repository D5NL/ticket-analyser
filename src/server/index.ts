import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ticketRoutes from './routes/ticketRoutes';
import { config } from './config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5175',  // development
  'http://localhost:5176',  // alternatieve development poort
  process.env.FRONTEND_URL || 'https://d5app.vercel.app', // production frontend URL
  process.env.CLIENT_URL || 'https://jouw-domain.vercel.app' // production
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} niet toegestaan door CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Verhoog de limiet voor JSON payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Start de server direct, ongeacht databaseverbinding
const server = app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});

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
      } catch (cmdError) {
        // @ts-ignore
        diagnostics.commandError = {
          message: cmdError.message,
          code: cmdError.code
        };
      }
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostische fout',
      details: error.message
    });
  }
});

// Verbinding maken met MongoDB Atlas...
console.log('Verbinding maken met MongoDB Atlas...');

// Configuratie voor mongoose
mongoose.set('strictQuery', false);

// Verbinding maken met MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Verbonden met MongoDB Atlas');
    // Server is al gestart, geen tweede start nodig
  })
  .catch((error) => {
    console.error('MongoDB verbindingsfout:', error);
  }); 