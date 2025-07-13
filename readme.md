
<!-- chai aur backend -->

This is a video series on backend  course 

// import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs"

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null
//         const reponse = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         })
//         console.log("file is uploaded to cloudinary", reponse.url);
//         return reponse;
//         console.log(reponse);

//     } catch (error) {
//       fs.unlinkSync(localFilePath)
//       //remove the locally saved temporary file as the operation got failed
//       return null
//     }
// }

// export {uploadOnCloudinary}

// src/utils/Cloudinary.js



user.routes.js

// import { ApiErrors } from "../utils/ApiErrors.js"
// import { asyncHandler } from "../utils/asyncHandler.js"
// import { User } from "../models/User.model.js"
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { uploadOnCloudinary } from "../utils/Cloudinary.js"

// const registerUser = asyncHandler(async (req, res) => {
//   // res.status(200).json({
//   //   message:"hyy sabyasachi"
//   // })
//   // get user details from frontend
//   // validation - not empty
//   // check if user already exists: username, email
//   // check for images, check for avatar
//   // upload them to cloudinary, avatar
//   // create user object - create entry in db
//   // remove password and refresh token field from response
//   // check for user creation
//   // return res

//   const { fullName, email, username, password } = req.body
//   console.log("email", email);
//   if ([fullName, email, username, password].some(field => field?.trim() === "")) {
//     throw new ApiErrors(400, "All fields are required");
//   }
//   // 3. Check if user already exists: username, email

//   //use $ with operators.
//   const existedUser =await User.findOne({
//     $or: [{ username }, { email }]
//   })
  
//   console.log(existedUser);
//   if (existedUser) {
//     throw new ApiErrors(409, "User with email or username already exists")
//   }
//   // console.log(req.files);
  
//   const avatarLocalPath = req.files?.avatar?.[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

//   if (!avatarLocalPath) {
//     throw new ApiErrors(400, "Avtar is required")
//   }

//   // 4. (Implicitly checked by avatarLocalPath/coverImageLocalPath)
//   // 5. Upload to Cloudinary

//   const avatar = await uploadOnCloudinary(avatarLocalPath)
//   const coverdImage = await uploadOnCloudinary(coverImageLocalPath)

//   if (!avatar) {
//     throw new ApiErrors(500, "Avatar upload failed. Please try again.")
//   }

//   // 6. Create user object - create entry in DB
//   const user = await User.create({
//     username: username.toLowerCase(),
//     fullName,
//     email,
//     password,
//     avatar: avatar.url, // Save the URL from Cloudinary
//     coverImage: coverdImage?.url || "", // Save URL if exists, else empty string
//     // watchHistory and refreshToken will be initialized by default schema values
//   })

//   //  Remove password and refresh token field from response
//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken"
//   );

//   if (!createdUser) {
//     throw new ApiErrors(500, "Something went wrong while registering the user");
//   }
//   // 9. Return response
//   return res.status(201).json(
//     new ApiResponse(200, createdUser, "User registered successfully")
//   );

// })

// export default registerUser

//cloudinaqry.js
// import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs"; // Import Node.js file system module

// // Configure Cloudinary
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) {
//             console.log("No local file path provided for Cloudinary upload."); // Added more specific log
//             return null;
//         }

//         // Upload the file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, { // Corrected typo: reponse -> response
//             resource_type: "auto" // Auto-detect resource type (image, video, etc.)
//         });

//         // File has been uploaded successfully
//         // console.log("File is uploaded to Cloudinary successfully. URL:", response.url);
//         fs.unlinkSync(localFilePath)

//         // Remove the locally saved temporary file AFTER successful upload
//         fs.unlinkSync(localFilePath);

//         return response; // Return the full response object from Cloudinary (which includes .url)

//     } catch (error) {
//         // Log the actual Cloudinary error for debugging
//         console.error("Cloudinary upload failed:", error);

//         // Remove the locally saved temporary file even if the upload operation failed
//         // Add a check to ensure the file exists before attempting to delete it
//         if (fs.existsSync(localFilePath)) {
//             fs.unlinkSync(localFilePath);
//         }
//         return null; // Return null on failure
//     }
// }

// export { uploadOnCloudinary };

//user routes.js
// import { Router } from "express";
// import registerUser from "../controllers/user.controller.js";
// import { upload } from "../middlewares/multer.middleware.js";

// const router=Router()
// router.route("/register").post(
//     upload.fields([
//         {
//             name:"avatar", 
//             maxCount:1
//         },
        
//         {
//           name:"coverImage",
//           maxCount:1
//         }
//         //middleware request ke ander aur field add karta he.
//     ]),
//     registerUser)
// // router.route("/login").post(login) 

// export default router; 

//apierrors.js
/ class ApiErrors extends Error{
//    constructor(
//     statusCode,
//     message="something went wrong",
//     errors=[],
//     stack=""
//    ){
//      super(message)
//      this.data=null
//      this.errors=errors
//      this.sucess=false
//      this.statusCode=statusCode
//      this.message=message

//      if (stack) {
//         this.stack=stack
//      }else{
//         this.captureStackTrace(this,this.captureStackTrace)
//      }
//    }
// }

// export {ApiErrors}

//multer middleware.js

// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/temp")
//   },
//   filename: function (req, file, cb) {

//     cb(null, file.originalname)
//   }
// })

// export const upload = multer({ 
//     storage,
//  })


// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// // If you want to ensure the directory exists here, uncomment this:
// // import fs from 'fs'; 

// // Define __dirname for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const uploadDir = path.join(__dirname, '..', 'public', 'temp'); 

//         cb(null, uploadDir); 
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname); 
//     }
// });

// export const upload = multer({
//     storage,
// }).fields([
//     { name: 'avatar', maxCount: 1 },
//     { name: 'coverImage', maxCount: 1 }
// ]);

//user controller.js
// import { ApiErrors } from "../utils/ApiErrors.js"
// import { asyncHandler } from "../utils/asyncHandler.js"
// import { User } from "../models/User.model.js"
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { uploadOnCloudinary } from "../utils/Cloudinary.js"

// const registerUser = asyncHandler(async (req, res) => {
//     const { fullName, email, username, password } = req.body;
//     console.log("email:", email); // Keep this log

//     // Add a log for req.files to confirm Multer data
//     console.log("req.files from Multer:", req.files); // <--- ADD THIS LINE FOR DEBUGGING MULTER OUTPUT

//     if ([fullName, email, username, password].some(field => field?.trim() === "")) {
//         throw new ApiErrors(400, "All fields are required");
//     }

//     const existedUser = await User.findOne({
//         $or: [{ username }, { email }]
//     });

//     console.log("Existed User Check:", existedUser); // Keep this log
//     if (existedUser) {
//         throw new ApiErrors(409, "User with email or username already exists");
//     }

//     const avatarLocalPath = req.files?.avatar?.[0]?.path;
//     const coverImageLocalPath = req.files?.coverImage?.[0]?.path; // Correct variable name from now on

//     if (!avatarLocalPath) {
//         throw new ApiErrors(400, "Avatar file is required"); // Changed 'Avtar' to 'Avatar' for consistency
//     }

//     // --- IMPORTANT: The actual file upload calls ---
//     // If uploadOnCloudinary returns null, this means the file was not found or failed to upload
//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath); // <--- CHANGED `coverdImage` to `coverImage` for consistency

//     // Line 53 is probably around here (or the console.log before it)
//     if (!avatar) {
//         // This means uploadOnCloudinary failed to upload the avatar.
//         // Check your Cloudinary.js console logs for why it returned null (e.g., file not found)
//         throw new ApiErrors(500, "Avatar upload failed. Please try again.");
//     }

//     // Optional: Handle if cover image was provided but failed to upload
//     if (coverImageLocalPath && !coverImage) {
//         console.warn(`Cover image file was provided at ${coverImageLocalPath}, but failed to upload to Cloudinary.`);
//         // You might throw an error here, or just let it proceed without a cover image.
//         // For now, we'll let it proceed as the field is optional.
//     }

//     // 6. Create user object - create entry in DB
//     const user = await User.create({
//         username: username.toLowerCase(),
//         fullName,
//         email,
//         password,
//         avatar: avatar.url, // Correctly using avatar.url
//         coverImage: coverImage?.url || "", // <--- Using `coverImage` variable for consistency. It handles null/undefined correctly.
//         // watchHistory and refreshToken will be initialized by default schema values (ensure schema has defaults or is optional)
//     });

//     // Remove password and refresh token field from response
//     const createdUser = await User.findById(user._id).select(
//         "-password -refreshToken"
//     );

//     if (!createdUser) {
//         throw new ApiErrors(500, "Something went wrong while registering the user");
//     }

//     // 9. Return response
//     return res.status(201).json(
//         new ApiResponse(200, createdUser, "User registered successfully")
//     );
// });

// export default registerUser;

/*const loginUser = asyncHandler(async (req, res) => {
    // req body->data
    // username or email
    // find the user
    // password check
    //acess and refresh token
    //send cookie
    const { email, username, password } = req.body
    console.log(email);
    
    if (!username && !email) {
        throw new ApiErrors(400, "valid username or email existed")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiErrors(404, "user not found")
    }

    const existedPassword = await user.isPasswordCorrect(password)

    if (!existedPassword) {
        throw new ApiErrors(400, "password can not found")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const logggedInUser = await user.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("acessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:logggedInUser,accessToken,refreshToken
            },
            "user logged in Sucessfully"
        )
    )
})*/



/*const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .clearcookie("accessToken", options)
        .clearcookie("refreshToken", options)
        .json(ApiResponse(200, {}, "user has logged out"))
})*/
