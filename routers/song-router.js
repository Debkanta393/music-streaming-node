import express from "express"
import { createSong, getAllSongs, getSongById, getSongByName, searchSongsByTitle, updateSong, deleteSong, getAllSongOfArtistByURI } from "../controllers/song-controller.js"
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router()


// Song upload route
router.post(
  '/song/create',
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  createSong
);

router.get("/allSong", getAllSongs)
router.get("/author/:id", getAllSongOfArtistByURI)
router.get("/songById/:id", getSongById)
router.get("/song/:title", getSongByName)
router.get("/songs/search/:title", searchSongsByTitle)
router.put("/updateSong/:id",
  authMiddleware,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  updateSong)
router.delete("/deleteSong/:id", authMiddleware, deleteSong)

export default router