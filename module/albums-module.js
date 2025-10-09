import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  albumName: {
    type: String,
    required: true,
    trim: true
  },
  albumImage:{
    type: String,
    default: null
  },
  albums: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Title must be at least 3 characters long"]
      },
      genre: {
        type: String,
        required: true,
        trim: true
      },
      image: {
        type: String,
        required: true,
        default: null
      },
      audio: {
        type: String,
        required: true,
        default: null
      },
      duration: {
        type: Number,
        required: true,
        default: 0
      },
      description: {
        type: String,
        trim: true
      },
      like: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          }
        }
      ],
      listenNumber: {
        type: Number,
        default: 0
      }
    }
  ]
}, { timestamps: true });

const Albums = mongoose.model("Albums", albumSchema);
export default Albums;
