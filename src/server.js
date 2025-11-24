import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import productRoute from './routes/productRoute.js';
import transactionsRoute from './routes/transactionsRoute.js';
import job from './config/cron.js';

dotenv.config();

const app = express();

// 1. CORS FIRST — REQUIRED FOR EXPO + RENDER
app.use(cors({
  origin: true,
  credentials: true
}));

// 2. Global middleware
app.use(rateLimiter);
app.use(express.json());

// 3. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// ✅ FIX: Proper route mounting
app.use('/api/products', productRoute);           

// 4. Port
const PORT = process.env.PORT || 5001;

// 5. Start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});

// Start cron only in production
if (process.env.NODE_ENV === 'production') {
  job.start();
}
