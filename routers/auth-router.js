import express from "express";
const router = express.Router()
import { register, login, logout, forgotPassword, resetPassword, getUser, updateUser } from "../controllers/auth-controller.js"
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path"
import protectMiddleware from "../middleware/protectMiddleware.js"

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

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/user", authMiddleware, getUser)
router.put("/update-user", authMiddleware, upload.fields([
    { name: 'image', maxCount: 1 },
]),
    updateUser)

router.get('/secure-data', protectMiddleware, (req, res) => {
    res.json({ message: 'This is secure data', user: req.user });
});

export default router