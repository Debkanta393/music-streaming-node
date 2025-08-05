import express from "express";
const router = express.Router();
import { 
    createPaymentIntent, 
    confirmPayment, 
    getPaymentHistory, 
    createSubscription, 
    cancelSubscription 
} from "../controllers/payment-controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Payment routes (all require authentication)
router.post("/create-payment-intent", authMiddleware, createPaymentIntent);
router.post("/confirm-payment", authMiddleware, confirmPayment);
router.get("/payment-history", authMiddleware, getPaymentHistory);
router.post("/create-subscription", authMiddleware, createSubscription);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);

export default router; 