
import mongoose from "mongoose";
import { DB_NAME } from "./constants";







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