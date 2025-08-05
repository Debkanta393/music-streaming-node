import Artist from "../module/song-module.js"
import mongoose from "mongoose";

const createSong = async (req, res) => {
    try {
        const { title, genre, duration, description } = req.body;
        const songDuration = parseFloat(duration);
        const artist = req.user._id;

        const image = req.files?.image?.[0];
        const audio = req.files?.audio?.[0];

        console.log(title)
        console.log(genre)
        console.log(duration)
        console.log(description)
        console.log(image)
        console.log(audio)

        if (!title || !genre || !image || !audio) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if artist record exists
        const artistDoc = await Artist.findOne({ artist });

        if (!artistDoc) {
            // First time: create artist document with first song
            const newArtist = await Artist.create({
                artist,
                songs: [
                    {
                        title,
                        genre,
                        duration: songDuration,
                        description,
                        image: image.path,
                        audio: audio.path,
                    }
                ]
            });

            console.log(newArtist)

            return res.status(201).json({ message: 'First song uploaded successfully', song: newArtist });
        }

        // Artist already exists — push a new song into the songs array
        const updatedArtist = await Artist.findOneAndUpdate(
            { artist },
            {
                $push: {
                    songs: {
                        title,
                        genre,
                        duration: songDuration,
                        description,
                        image: image.path,
                        audio: audio.path,
                    }
                }
            },
            { new: true }
        );

        res.status(201).json({ message: 'Song added successfully', artist: updatedArtist });
    } catch (error) {
        console.error('Create Song Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



const getAllSongs = async (req, res) => {
    try {
        const songs = await Artist.find().populate('artist')
        res.status(200).json({ songs })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}


const getAllSongOfArtistByURI=async(req, res)=>{
    try {
        const id=req.params.id
        

        const artistWithSong = await Artist.find({artist: id})
        console.log(artistWithSong)
        res.status(200).json({songs: artistWithSong})
    } catch (error) {
        res.status(500).json({message: "Server error"})
    }
}

const getSongByName = async (req, res) => {
    try {
        const title = req.params.title;
        console.log(title)

        const artistWithSongs = await Artist.findOne({
            "songs.title": title
        });

        if (!artistWithSongs) {
            return res.status(404).json({ message: "Song not found" });
        }
        // Filter matching song(s) from the array
        const matchingSongs = artistWithSongs.songs.filter(song => song.title === title);

        if (matchingSongs.length === 0) {
            return res.status(404).json({ message: "Song not found" });
        }
        

        res.status(200).json({ artist: artistWithSongs.artist, song: matchingSongs[0] });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const searchSongsByTitle=async(req, res)=>{
    try {
        const partialTitle = decodeURIComponent(req.params.title);
    
        // Add length check (optional)
        if (partialTitle.length < 1) {
          return res.status(400).json({ message: "Search term too short" });
        }
    
        const artists = await Artist.find({
          "songs.title": { $regex: partialTitle, $options: "i" },
        });
    
        const matchingSongs = artists.flatMap(artist =>
          artist.songs
            .filter(song => song.title.toLowerCase().includes(partialTitle.toLowerCase()))
            .map(song => ({
              ...song.toObject(),
              genre: song.genre,
              _id: song._id,
            }))
        );
    
        return res.json(matchingSongs.slice(0, 10));
      } catch (err) {
        console.error("Search error:", err);
        return res.status(500).json({ message: "Server error" });
      }
}


const getFilename = (filePath) => {
    return filePath?.split('\\').pop() || '';
};

const getSongById = async (req, res) => {
    try {
        const songId = req.params.id;

        // Verify the songId
        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid song ID" });
        }

        const artistWithSong = await Artist.findOne({ "songs._id": songId }).populate('artist');

        if (!artistWithSong) {
            return res.status(404).json({ message: "Song not found in database" });
        }
        console.log("Getting song by id", artistWithSong)
        // Extract the specific song
        const matchingSong = artistWithSong.songs.id(songId);
        if (!matchingSong) {
            return res.status(404).json({ message: "Song found in document, but not in array" });
        }

        // ✅ Extract filenames from path
        const audioFilename = getFilename(matchingSong.audio);
        const imageFilename = getFilename(matchingSong.image);

        // ✅ Return secure API URLs for frontend to use
        res.status(200).json({
            artistName: artistWithSong.artist.name,
            artistId: artistWithSong.artist._id,
            song: {
                ...matchingSong.toObject(),
                audioUrl: `/api/audio/${audioFilename}`,
                imageUrl: `/api/image/${imageFilename}`,
            },
        });
    } catch (error) {
        console.error("Get Song By ID Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const updateSong = async (req, res) => {
    try {
        console.log(req.params.id)
        const { title, genre, duration, description } = req.body;
        const image = req.files?.image?.[0];
        const audio = req.files?.audio?.[0];

        const artistId = req.user._id; // From JWT
        const songId = req.params.id; // This is the song's _id

        console.log("Title", title)
        console.log("Genre", genre)
        console.log("Duration", duration)
        console.log("Description", description)
        console.log("Image", image)
        console.log("Audio", audio)

        // Find the artist who owns the song
        const artistDoc = await Artist.findOne({ artist: artistId, "songs._id": songId });

        if (!artistDoc) {
            return res.status(404).json({ message: "Song not found" });
        }

        // Find the specific song
        const song = artistDoc.songs.id(songId);

        if (title) song.title = title;
        if (genre) song.genre = genre;
        if (duration) song.duration = parseFloat(duration);
        if (description) song.description = description;
        if (image) song.image = image.path;
        if (audio) song.audio = audio.path;
        song.updatedAt = Date.now();

        await artistDoc.save();

        res.status(200).json({ message: "Song updated successfully", song });
    } catch (error) {
        console.error("Update Song Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteSong = async (req, res) => {
    try {
        const songId = req.params.id;
        const artistId = req.user._id; // assuming auth middleware adds this

        const artist = await Artist.findOne({ artist: artistId, "songs._id": songId });

        if (!artist) {
            return res.status(404).json({ message: "Song not found" });
        }

        // Remove the song by ID
        artist.songs = artist.songs.filter(song => song._id.toString() !== songId);

        await artist.save();

        res.status(200).json({ message: "Song deleted successfully", status: "Ok" });
    } catch (error) {
        console.error("Delete Song Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export { createSong, getAllSongs, getSongById, getSongByName, searchSongsByTitle, updateSong, deleteSong, getAllSongOfArtistByURI }