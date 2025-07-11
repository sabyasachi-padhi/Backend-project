// src/controllers/user.controller.js

import { ApiErrors } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/User.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"


const generateAcessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateAcessToken()
        const acessToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { acessToken, refreshToken }

    } catch (error) {
        throw new ApiErrors(500, "something went wrong while generating refresh and acess token");

    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;
    console.log("email:", email);

    // Add a log for req.files to confirm Multer data
    console.log("req.files from Multer:", req.files);

    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiErrors(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    console.log("Existed User Check:", existedUser);
    if (existedUser) {
        throw new ApiErrors(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // CHANGE this line: Access 'coverdImage' from req.files to match Multer config
    const coverdImageLocalPath = req.files?.coverdImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is required");
    }

    // --- IMPORTANT: The actual file upload calls ---
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // CHANGE this line: Use 'coverdImage' as the variable name
    const coverdImage = await uploadOnCloudinary(coverdImageLocalPath);

    // Line 53 is probably around here (or the console.log before it)
    if (!avatar) {
        throw new ApiErrors(500, "Avatar upload failed. Please try again.");
    }

    // Optional: Handle if cover image was provided but failed to upload
    // CHANGE this line: Use 'coverdImageLocalPath' and 'coverdImage'
    if (coverdImageLocalPath && !coverdImage) {
        console.warn(`Cover image file was provided at ${coverdImageLocalPath}, but failed to upload to Cloudinary.`);
    }

    // 6. Create user object - create entry in DB
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url, // Correctly using avatar.url
        // CHANGE this line: Assign to 'coverdImage' schema field using 'coverdImage' variable
        coverdImage: coverdImage?.url || "",
        // watchHistory and refreshToken will be initialized by default schema values (ensure schema has defaults or is optional)
    });

    // Remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while registering the user");
    }

    // 9. Return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
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

    const { acessToken, refreshToken } = await generateAcessAndRefreshToken(user._id)
    const logggedInUser = await user.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("acessToken",acessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:logggedInUser,acessToken,refreshToken
            },
            "user logged in Sucessfully"
        )
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
       $set:{
        refreshToken:undefined
       }
    },
    {
        new:true
    }
  )
   const options={
        httpOnly:true,
        secure:true,
    }
  return res 
  .status(200)
  .clearcookie("acessToken",options)
  .clearcookie("refreshToken",options)
  .json(ApiResponse(200,{},"user has logged out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}
