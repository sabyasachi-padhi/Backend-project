
import 'dotenv/config'; 
import { app } from './app.js';
import connectDB from "./db/index.js";

// import dotenv from "dotenv"
// dotenv.config({path:'./.env'})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`app listen on port :${process.env.PORT}`);
        
    })
})
.catch((error)=>{
    console.log("MONGODB CONNECTION FAILED",error);
    
})




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