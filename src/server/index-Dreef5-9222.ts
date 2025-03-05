import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ticketRoutes from './routes/ticketRoutes.js';
import { config } from './config.js';

dotenv.config();

const app = express();
// Hardcoded poort naar 3001 zonder gebruik van process.env.PORT
const PORT = 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5175', process.env.CLIENT_URL];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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

// Routes
app.use('/api/tickets', ticketRoutes);

// MongoDB verbinding
mongoose.connect(process.env.MONGODB_URI!, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Verbonden met MongoDB');
  // Expliciet loggen dat we poort 3001 gebruiken
  console.log(`Server start op poort 3001...`);
  app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB verbindingsfout:', error);
  if (error.name === 'MongooseServerSelectionError') {
    console.error('Server selectie timeout. Controleer je netwerk verbinding.');
  }
}); 