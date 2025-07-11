// src/utils/Cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"; // Import Node.js file system module
import { promises as fsPromises } from 'fs'; // ADD this line for async unlink

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("Cloudinary Upload Debug: No local file path provided. Returning null."); // Clarified log
            return null;
        }

        console.log(`Cloudinary Upload Debug: Attempting to upload file from local path: ${localFilePath}`); // Added log

        // ADD this CRUCIAL CHECK: Verify if the file actually exists on disk
        if (!fs.existsSync(localFilePath)) {
            console.error(`Cloudinary Upload Debug: ERROR - File DOES NOT EXIST at local path: ${localFilePath}`);
            return null; // File does not exist, cannot upload
        }
        console.log(`Cloudinary Upload Debug: File EXISTS at local path: ${localFilePath}`); // Added log


        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("Cloudinary Upload Debug: File uploaded to Cloudinary successfully. URL:", response.url); // Clarified log

        // CHANGE these lines: Remove duplicate unlink and use async unlink
        // fs.unlinkSync(localFilePath) // REMOVE THIS LINE
        // fs.unlinkSync(localFilePath); // REMOVE THIS LINE (duplicate)
        await fsPromises.unlink(localFilePath); // Use async unlink for better performance
        console.log(`Cloudinary Upload Debug: Local temporary file deleted: ${localFilePath}`); // Added log

        return response; // Return the full response object from Cloudinary (which includes .url)

    } catch (error) {
        console.error("Cloudinary Upload Debug: Cloudinary upload process FAILED. Error:", error); // Clarified log

        // Remove the locally saved temporary file even if the upload operation failed
        if (fs.existsSync(localFilePath)) {
            // CHANGE this line: Use async unlink in catch block too
            // fs.unlinkSync(localFilePath);
            try {
                await fsPromises.unlink(localFilePath);
                console.log(`Cloudinary Upload Debug: Local file deleted in catch block: ${localFilePath}`); // Added log
            } catch (deleteErrorInCatch) {
                console.error(`Cloudinary Upload Debug: ERROR deleting local file in catch block ${localFilePath}:`, deleteErrorInCatch.message);
            }
        }
        return null; // Return null on failure
    }
}

export { uploadOnCloudinary };
