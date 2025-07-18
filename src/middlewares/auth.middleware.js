// src/middlewares/auth.middleware.js
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Log the raw cookies received by the server
        console.log("req.cookies:", req.cookies);

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("Extracted Token:", token); // Log the token that will be verified

        if (!token) {
            console.log("No token found.");
            throw new ApiErrors(401, "Unauthorized request: Access token missing.");
        }

        // Log the secret key being used for verification
        console.log("ACCESS_TOKEN_SECRET (from .env):", process.env.ACCESS_TOKEN_SECRET); // This is important!

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded Token Payload:", decodedToken); // Log the decoded payload

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        console.log("User found from DB:", user ? user.username : "None");

        if (!user) {
            console.log("User not found for decoded token ID.");
            throw new ApiErrors(401, "Invalid access token: User not found.");
        }

        req.user = user;
        next();

    } catch (error) {
        // Log the exact error message from jwt.verify
        console.error("Error in verifyJWT catch block:", error.name, error.message); // THIS IS THE MOST CRITICAL LINE
        throw new ApiErrors(
            401,
            error.message || "Invalid or expired access token."
        );
    }
});









// import { ApiErrors } from "../utils/ApiErrors.js";
// import { asyncHandler } from "../utils/asyncHandler.js";  
// import jwt from "jsonwebtoken"
// import { User } from "../models/User.model.js"

// export const verifyJWT = asyncHandler(async (req, res, next) => {
//    try {
//       const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

//       if (!token) {
//          throw new ApiErrors(404, "unauthorized authorization")
//       }

//       const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
//       const user = await User.findById(decodeToken?._id).select("-password -refreshToken")

//       if (!user) {
//          // discuss about frontend
//          throw new ApiErrors(401, "Invalid access token")
//       }

//       req.user = user
//       next()

//    } catch (error) {
//       throw new ApiErrors(401, error ?.mesaage || "Invalid refershToken")
//    }

// })