import express from "express"
import authMiddleware from "../middleware/authMiddleware.js";
import { getQNA, addQNA } from "../controllers/qna-controller.js"

const router=express.Router()

router.get("/qna/:id", getQNA)
router.post("/add-qna/:id", authMiddleware, addQNA)

export default router