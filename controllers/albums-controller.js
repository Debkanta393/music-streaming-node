import Albums from "../module/albums-module.js";

const createAlbums = async (req, res) => {
    try {
      const { albumName, title, genre, duration, description } = req.body;
      const artist = req.user;
      const songDuration = parseFloat(duration);
  
      
      const albumImage = req.files?.albumImage?.[0];
      const image = req.files?.image?.[0];
      const audio = req.files?.audio?.[0];
      console.log(albumImage);
      console.log(image.path);
  
      // Validate required fields
      if (!albumName || !title || !genre || !image || !audio || !duration || !description || !albumImage) {
        return res.status(400).json({ message: "All fields required" });
      }
  
      let albumDoc = await Albums.findOne({ artist, albumName });
  
      if (!albumDoc) {
        albumDoc = new Albums({
          artist,
          albumName,
          albumImage: albumImage.path,
          albums: [
            {
              title,
              genre,
              image: image? image.path: null,
              audio: audio? audio.path: null,
              duration: songDuration,
              description
            }
          ]
        });
        await albumDoc.populate("artist", "name _id");
        await albumDoc.save();
        return res.status(200).json({ message: "Album created successfully", album: albumDoc });
      } else {
        albumDoc.albums.push({
          title,
          genre,
          image: image? image.path:null,
          audio: audio? audio.path: null,
          duration: songDuration,
          description
        });
        await albumDoc.populate("artist", "name _id");
        await albumDoc.save();
        return res.status(200).json({ message: "Song added in the albums", album: albumDoc });
      }
    } catch (error) {
      console.log("Error in server", error);
      return res.status(500).json({ message: "Song can't be added", error });
    }
  };
  

const getAllAlbums = async (req, res) => {
    try {
        const albums = await Albums.find({}, { albums: 0 }).populate("artist", "name _id")
        return res.status(200).json({ albums })
    } catch (error) {
        return res.status(500).json({ message: "Error in fetching albums" })
    }
}

const getAlbumSong = async (req, res) => {
    try {
        const { id } = req.params

        // Check artistId receive or not
        if (!id) {
            return res.status(500).json({ message: "No album found" })
        }

        // Fetch all song from album
        const albumDoc = await Albums.findById(id).populate("artist", "name _id");
        return res.status(200).json({ album: albumDoc })
    } catch (error) {
        return res.status(500).json({ message: "Error is fetching albums" })
    }
}

export { createAlbums, getAllAlbums, getAlbumSong }