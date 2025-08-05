import express from "express";
import { 
    addToCart, 
    getCartItems, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    getCartCount 
} from "../controllers/cart-controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

// Add product to cart
router.post("/add", addToCart);

// Get user's cart items
router.get("/items", getCartItems);

// Update cart item quantity
router.put("/update", updateCartItem);

// Remove item from cart
router.delete("/remove/:productId", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

// Get cart count
router.get("/count", getCartCount);

export default router; 