import mongoose from "mongoose";
import Product from "../module/product-module.js";


const getFilename = (filePath) => {
    return filePath?.split('\\').pop() || '';
};

const uploadProduct = async (req, res) => {
    try {
        const { proName, proDes, price, color, items } = req.body;
        const priceDetails = parseFloat(price);
        const itemsNum = parseFloat(items);
        const artist = req.user._id;

        const image = req.files?.image?.[0];

        if (!proName || !proDes || !price || !image || !color || !items) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if artist record exists
        const artistDoc = await Product.findOne({ artist });

        if (!artistDoc) {
            // First time: create artist document with first product
            const newArtist = await Product.create({
                artist,
                product: [
                    {
                        proName,
                        proDes,
                        price: priceDetails,
                        image: image.path,
                        color,
                        items: itemsNum
                    }
                ]
            });

            return res.status(201).json({ message: 'First product uploaded successfully', product: newArtist });
        }


        // ✅ Extract filenames from path
        const imageFilename = getFilename(image.path);


        // Artist already exists — push a new product into the product array
        const updatedArtist = await Product.findOneAndUpdate(
            { artist },
            {
                $push: {
                    product:
                    {
                        proName,
                        proDes,
                        price: priceDetails,
                        image: `/api/image/${imageFilename}`,
                        color,
                        items: itemsNum
                    }
                }
            },
            { new: true }
        );

        res.status(201).json({ message: 'Product added successfully', artist: updatedArtist });
    } catch (error) {
        console.error('Create product Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// const getSongByName = async (req, res) => {
//     try {
//         const title = req.params.title;

//         const artistWithSongs = await Product.findOne({
//             "songs.title": title
//         });

//         if (!artistWithSongs) {
//             return res.status(404).json({ message: "Song not found" });
//         }
//         // Filter matching song(s) from the array
//         const matchingSongs = artistWithSongs.songs.filter(song => song.title === title);

//         if (matchingSongs.length === 0) {
//             return res.status(404).json({ message: "Song not found" });
//         }

//         res.status(200).json({ artist: artistWithSongs.artist, songs: matchingSongs });
//     } catch (error) {
//         return res.status(500).json({ message: "Internal server error" })
//     }
// }

const updateProduct = async (req, res) => {
    try {
        const { proName, proDes, price, color, items } = req.body;
        const image = req.files?.image?.[0];

        const artistId = req.user._id; // From JWT
        const productId = req.params.id; // This is the product's _id

        // Find the artist who owns the product
        const artistDoc = await Product.findOne({ artist: artistId, "product._id": productId });

        if (!artistDoc) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Find the specific product
        const product = artistDoc.product.id(productId);

        if (proName) product.proName = proName;
        if (proDes) product.proDes = proDes;
        if (price) product.price = parseFloat(price);
        if (image) product.image = image.path;
        if (color) product.color = color;
        if (items) product.items = items;
        product.updatedAt = Date.now();

        await artistDoc.save();

        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error("Update product Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Corrected: match against "product._id"
        const artistWithProduct = await Product.findOne({
            "product._id": new mongoose.Types.ObjectId(productId)
        });

        if (!artistWithProduct) {
            return res.status(404).json({ message: "Product not found in database" });
        }


        // Remove the product by ID
        artistWithProduct.product = artistWithProduct.product.filter(product => product._id.toString() !== productId);

        await artistWithProduct.save();

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getAllProducts = async (req, res) => {
    try {

        const artist = req.params.id
        if (!artist) {
            return res.status(500).json({ message: "No artist found" })
        }

        // Get all product of an artist
        const products = await Product.findOne({ artist })

        return res.status(201).json({ artist: artist, products: products })

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const getProductsById = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Corrected: match against "product._id"
        const artistWithProduct = await Product.findOne({
            "product._id": new mongoose.Types.ObjectId(productId)
        }).populate('artist');

        if (!artistWithProduct) {
            return res.status(404).json({ message: "Product not found in database" });
        }

        const matchingProduct = artistWithProduct.product.find(
            (product) => product._id.toString() === productId
        );

        if (!matchingProduct) {
            return res.status(404).json({ message: "Product found in document, but not in array" });
        }
        return res.status(200).json({
            artistId: artistWithProduct.artist._id,
            artistName: artistWithProduct.artist.name,
            product: matchingProduct
        })

    } catch (error) {
        console.error("Error in getProductsById:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};



export { uploadProduct, updateProduct, deleteProduct, getAllProducts, getProductsById }