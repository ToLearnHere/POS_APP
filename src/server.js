import express from 'express';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import productRoutes from './routes/productRoute.js';
import transactionsRoute from "./routes/transactionsRoute.js"
import job from "./config/cron.js";
import cors from 'cors';

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") job.start();

//built-in middleware to parse JSON bodies
app.use(cors());
app.use(rateLimiter);
app.use(express.json());

// routes
app.use('/api', productRoutes);
app.use("/api/transactions", transactionsRoute);

const PORT = process.env.PORT || 5001;

app.get("/api/health", (req, res) => {
    res.status(200).json({status: "OK"});
}) 

app.use("/api/transactions", transactionsRoute);
app.use('/api', productRoutes);   

console.log("my port:",process.env.PORT)

initDB().then (() => {
    app.listen(PORT, () => {
        console.log("Server is running on PORT:", PORT);
    });
})