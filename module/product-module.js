import mongoose from "mongoose";


const products = new mongoose.Schema({
    proName: {
        type: String,
        required: true
    },
    proDes: [{
        type: String,
        required: true
    }],
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    color: {
        type: Array,
        required: true
    },
    items: {
        type: Number,
        required: true
    }

})

const productSchema=new mongoose.Schema({
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: [products]
})

const Product=new mongoose.model("Product", productSchema)
export default Product