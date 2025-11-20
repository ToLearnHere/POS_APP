import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';                    // MUST HAVE
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import productRoutes from './routes/productRoute.js';
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
app.use('/api', productRoutes);           // products, categories, etc.
app.use('/api/transactions', transactionsRoute);

// 5. Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// 6. 404 catcher (helps debugging)
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});
app.get('/api/debug-db', async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;
    res.json({ db_connected: true, time: result[0].now });
  } catch (err) {
    res.status(500).json({ db_connected: false, error: err.message });
  }
});
// ADD THIS TEMPORARY TEST ROUTE
app.get('/api/test', (req, res) => {
  res.json({ message: "Server is working!", time: new Date().toISOString() });
});
app.get('/api/ping', (req, res) => {
  res.json({ ping: "pong", time: new Date().toISOString() });
});



const PORT = process.env.PORT || 5001;

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test categories: http://YOUR_IP:${PORT}/api/categories`);
    console.log(`Test products:  http://YOUR_IP:${PORT}/api/products`);
  });
});

// Start cron only in production
if (process.env.NODE_ENV === 'production') job.start();