import express from 'express';
import dotenv from 'dotenv';


import { sql } from '../config/db.js'

dotenv.config();

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const products = await sql`SELECT * FROM products`;
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
