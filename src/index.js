// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

dotenv.config({path:'./.env'})
connectDB()




// import express from "express"
// const app=express()
// (async()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error",(error)=>{
//         console.log("app throw server error");
//         throw error
//     })
//     app.listen(()=>{
//         console.log(`App is listen on PORT ${process.env.PORT}`);
//     })
//     } catch (error) {
//         console.log(error);
        
//     }
// })()