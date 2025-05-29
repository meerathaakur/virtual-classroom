const mongoose=require("mongoose")

let MONGO_URI= process.env.NODE_ENV==="production"?process.env.DATABASE_URL : "mongodb://127.0.0.1:27017/Virtual-classroom"

const connectDB= async()=>{
    try {
        await mongoose.connect(MONGO_URI)
        console.log("DB connected")
    } catch (error) {
        console.log("DB connection failed")
        process.exit(1);
    }
}

module.exports=connectDB