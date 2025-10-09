import express from "express";
const router = express.Router();
import { 
    createPaymentIntent, 
    confirmPayment, 
    getPaymentHistory, 
    getAvailableGateways,
    createSubscription, 
    cancelSubscription 
} from "../controllers/payment-controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

// ==================== PAYMENT ROUTES ====================

// Create a payment intent/order
router.post("/payment-intent", authMiddleware, createPaymentIntent);

// Confirm a payment (Stripe, PayPal, Razorpay)
router.post("/payment-confirm", authMiddleware, confirmPayment);

// Get user’s payment history
router.get("/payment-history", authMiddleware, getPaymentHistory);

// ✅ Public route — show available gateways
router.get("/payment-gateways", getAvailableGateways);

// ==================== SUBSCRIPTIONS ====================

// Create a new subscription
router.post("/payment-subscription", authMiddleware, createSubscription);

// Cancel an existing subscription
router.delete("/cancel-subscription/:id", authMiddleware, cancelSubscription);

export default router;
