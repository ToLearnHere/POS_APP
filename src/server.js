import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';                    // MUST HAVE
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import productRoute from './routes/productRoute.js';
import transactionsRoute from './routes/transactionsRoute.js';
import job from './config/cron.js';

dotenv.config();

const app = express();

// 1. CORS FIRST — THIS FIXES THE HTML ERROR
app.use(cors({
  origin: true,        // Allows Expo Go (very important!)
  credentials: true
}));

// 2. Other middleware
app.use(rateLimiter);
app.use(express.json());

// 3. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// 4. Mount routes — THIS MUST BE EXACT
app.use('/api', productRoute);           // products, categories, etc.
app.use('/api/transactions', transactionsRoute);

const PORT = process.env.PORT || 5001;

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Start cron only in production
if (process.env.NODE_ENV === 'production') job.start();