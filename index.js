import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import authRouter from "./routers/auth-router.js";
import songRouter from "./routers/song-router.js";
import productRouter from "./routers/product-router.js";
import cartRouter from "./routers/cart-router.js";
import paymentRouter from "./routers/payment-router.js";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import cors from "cors";
import multer from "multer";
import fileRouter from "./routers/file-router.js";
import reviewRouter from "./routers/review-router.js";
import qnaRouter from "./routers/qna-router.js";
import albumRouter from "./routers/album-router.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Split comma-separated origins from .env
const allowedOrigins = [process.env.FRONTEND_URL, process.env.APP_URL];

// CORS middleware should be before routes and static files
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRouter);
app.use("/api/song", songRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payment", paymentRouter);
app.use("/api", fileRouter);
app.use("/api/product", reviewRouter);
app.use("/api/product", qnaRouter);
app.use("/api/album", albumRouter);

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running at port ${port}`);
});
