import express from "express";
import dotenv from "dotenv"
import connectDB from "./db/db.js"
import authRouter from "./routers/auth-router.js"
import songRouter from "./routers/song-router.js"
import productRouter from "./routers/product-router.js"
import cartRouter from "./routers/cart-router.js"
import paymentRouter from "./routers/payment-router.js"
import cookieParser from "cookie-parser";
import nodemailer from 'nodemailer';
import cors from "cors"
import multer from "multer";
import fileRouter from "./routers/file-router.js"


dotenv.config()
const app = express()
const port = process.env.PORT || 5000

// Connect to MongoDB
connectDB()


// CORS middleware should be before routes and static files
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400
}))


// Middleware
app.use(express.json())
app.use(cookieParser())




// app.use('/uploads', (req, res, next) => {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).send("Unauthorized");
  
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = decoded;
//       next();
//     } catch (err) {
//       return res.status(403).send("Invalid token");
//     }
//   }, express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));
app.use("/api/auth", authRouter)
app.use("/api/song", songRouter)
app.use("/api/products", productRouter)
app.use("/api/cart", cartRouter)
app.use("/api/payment", paymentRouter)
app.use("/api", fileRouter)

// Start the server
app.listen(port, () => {
    console.log(`Server is running at port ${port}`)
});