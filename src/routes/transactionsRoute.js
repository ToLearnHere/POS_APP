import express from "express"

import {getTransactionsByUserId, createTransaction, deleteTransaction, getSummary} from "../controllers/transactionsController.js"

const router = express.Router()

router.post("/", createTransaction);

router.get("/:userId", getTransactionsByUserId);
router.delete("/:id", deleteTransaction);

router.get("/summary/:userId", getSummary)
export default router