import mongoose from "mongoose";

export default async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB successfully connected")
    }
    catch(error){
        console.log("MongoDB connection failed", error)
    }
}