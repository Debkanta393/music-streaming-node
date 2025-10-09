import express from "express"
import { getReviews, addReview } from "../controllers/review-controller.js"
import authMiddleware from "../middleware/authMiddleware.js"
const router=express.Router()

router.get("/reviews/:id", getReviews)
router.post("/add-review/:id", authMiddleware, addReview)

export default router