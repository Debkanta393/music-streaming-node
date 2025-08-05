import express from "express";
import { uploadProduct, updateProduct, deleteProduct, getAllProducts, getProductsById } from "../controllers/product-controller.js";
import authMiddleware from "../middleware/authMiddleware.js"
import multer from "multer";
import path from "path"

const router = express.Router()

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in /uploads
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

router.get("/:id", getAllProducts)

router.get("/product/:id", getProductsById)

router.post("/upload/product",
    authMiddleware,
    upload.fields([
        { name: 'image', maxCount: 1 },
    ]), uploadProduct)

router.put("/update-product/:id", authMiddleware,
    upload.fields([
        { name: 'image', maxCount: 1 },
    ]),
    updateProduct)

router.delete("/delete-product/:id", deleteProduct)

export default router