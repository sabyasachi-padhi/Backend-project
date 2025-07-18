
import mongoose from "mongoose";

// import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        
        // Your MONGODB_URI already contains the database name (e.g., /sabyasachi).
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1); // Exit the process with a failure code
    }
}

export default connectDB;