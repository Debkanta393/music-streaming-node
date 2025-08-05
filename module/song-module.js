import mongoose from "mongoose";
import userSchema from "./auth-module.js";

const songSchema=new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Title must be at least 3 characters long"]
    },
    genre:{
        type: String,
        required: true,
        trim: true
    },
    image:{
        type: String,
        required: true,
        default: null
    },
    audio:{
        type: String,
        required: true,
        default: null
    },
    duration:{
        type: Number,
        required: true,
        default: 0
    },
    description:{
        type: String
    },
    isLiked:{
        type: String,
        enum: ["true", "false"],
        default: false
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
})

const artistSchema=new mongoose.Schema({
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songs: [songSchema]
})

const Artist=mongoose.model("Artist", artistSchema)

export default Artist