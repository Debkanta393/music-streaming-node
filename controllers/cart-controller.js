import User from "../module/auth-module.js";
import Product from "../module/product-module.js";
import mongoose from "mongoose";

// Add to cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Find the product
        const productDoc = await Product.findOne({
            "product._id": new mongoose.Types.ObjectId(productId)
        });

        if (!productDoc) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Find the specific product in the array
        const product = productDoc.product.find(p => p._id.toString() === productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if product is in stock
        if (product.items < quantity) {
            return res.status(400).json({ message: "Not enough items in stock" });
        }

        // Find user and check if product already exists in cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Initialize cart if it doesn't exist
        if (!user.cartProduct) {
            user.cartProduct = [];
        }

        // Check if product already exists in cart
        const existingCartItem = user.cartProduct.find(item =>
            item.productId.toString() === productId
        );

        if (existingCartItem) {
            // Update quantity if product already exists
            existingCartItem.quantity += quantity;
            existingCartItem.totalPrice = existingCartItem.quantity * existingCartItem.price;
        } else {
            // Add new product to cart
            const cartItem = {
                productId: product._id,
                proName: product.proName,
                proDes: product.proDes,
                price: product.price,
                image: product.image,
                color: product.color,
                quantity: quantity,
                totalPrice: product.price * quantity,
                artistId: productDoc.artist,
                addedAt: new Date()
            };
            user.cartProduct.push(cartItem);
        }

        await user.save();

        res.status(200).json({
            message: "Product added to cart successfully",
            cart: user.cartProduct
        });

    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get cart items
const getCartItems = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate('cartProduct.productId');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            cart: user.cartProduct || [],
            totalItems: user.cartProduct ? user.cartProduct.length : 0
        });

    } catch (error) {
        console.error("Get cart error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;

        if (!productId || quantity === undefined) {
            return res.status(400).json({ message: "Product ID and quantity are required" });
        }

        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the cart item
        const cartItem = user.cartProduct.find(item =>
            item.productId.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        // Check stock availability
        const productDoc = await Product.findOne({
            "product._id": new mongoose.Types.ObjectId(productId)
        });

        if (!productDoc) {
            return res.status(404).json({ message: "Product not found" });
        }

        const product = productDoc.product.find(p => p._id.toString() === productId);
        if (product.items < quantity) {
            return res.status(400).json({ message: "Not enough items in stock" });
        }

        // Update quantity and total price
        cartItem.quantity = quantity;
        cartItem.totalPrice = cartItem.price * quantity;

        await user.save();

        res.status(200).json({
            message: "Cart updated successfully",
            cart: user.cartProduct
        });

    } catch (error) {
        console.error("Update cart error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("Product id", productId)

        // Remove item from cart
        user.cartProduct = user.cartProduct.filter(item =>
            item._id.toString() !== productId
        );
        console.log(user)

        await user.save();

        res.status(200).json({
            message: "Product removed from cart successfully",
            cart: user.cartProduct
        });

    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Clear cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.cartProduct = [];
        await user.save();

        res.status(200).json({
            message: "Cart cleared successfully",
            cart: []
        });

    } catch (error) {
        console.error("Clear cart error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get cart count
const getCartCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const cartCount = user.cartProduct ? user.cartProduct.length : 0;

        res.status(200).json({ cartCount });

    } catch (error) {
        console.error("Get cart count error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export {
    addToCart,
    getCartItems,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
}; 