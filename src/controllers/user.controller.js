
import { ApiErrors } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/User.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateAccessToken()
        const accessToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiErrors(500, "something went wrong while generating refresh and access token");

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
    const { email, username, password } = req.body;
    console.log(email);

    if (!username && !email) {
        throw new ApiErrors(400, "Username or email is required for login.");
    }

    const user = await User.findOne({
        $or: [
            { username: username?.toLowerCase() },
            { email: email?.toLowerCase() }
        ]
    });

    if (!user) {
        throw new ApiErrors(404, "User not found with the provided credentials.");
    }

    const existedPassword = await user.isPasswordCorrect(password);

    if (!existedPassword) {
        throw new ApiErrors(400, "Invalid credentials (incorrect password)."); // Clarified message from "password can not found"
    }

    // Ensure your generateAccessAndRefreshToken also uses 'accessToken'
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);


    // Efficiently create the loggedInUser object without another DB query
    const logggedInUser = user.toObject(); // Convert Mongoose document to a plain JavaScript object
    delete logggedInUser.password;
    delete logggedInUser.refreshToken;

    const options = {
        httpOnly: true,
        secure: true,
        // secure: process.env.NODE_ENV === 'production',
        // sameSite: 'None', // If frontend and backend are on different domains
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: logggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in Successfully"
            )
        );
});


const logoutUser = asyncHandler(async (req, res) => {
    // 1. Get the refreshToken from cookies
    const refreshTokenFromCookie = req.cookies?.refreshToken;

    if (!refreshTokenFromCookie) {
        // If no refresh token is present, the user is likely not logged in
        // or the token was already cleared.
        return res
            .status(200) // Still return 200, as the desired state (logged out) is achieved
            .json(new ApiResponse(200, {}, "User already logged out or no session found."));
    }

    let decodedToken;
    try {
        // 2. Decode the refresh token to get the user ID
        // Ensure process.env.REFRESH_TOKEN_SECRET is correctly loaded
        decodedToken = jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        // Handle cases where the refresh token is invalid or expired
        // Still clear cookies to ensure logout completes, even with a bad token
        const options = { httpOnly: true, secure: true };
        return res
            .status(200) // Return 200 even if token is bad, as we want to log out
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "Invalid or expired session. Cookies cleared."));
    }

    const userId = decodedToken?._id;

    if (!userId) {
        // This case should ideally not happen if jwt.verify succeeds and token format is correct
        throw new ApiErrors(401, "User ID not found in decoded refresh token.");
    }

    // 3. Update the user in the database to remove the stored refresh token
    await User.findByIdAndUpdate(
        userId, // Use the userId obtained from the decoded refresh token
        {
            $set: {
                refreshToken: undefined // Set refreshToken to undefined or null
            }
        },
        {
            new: true // Return the updated document (optional for this operation)
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
        // In production, consider `sameSite: 'None'` if frontend and backend are on different domains
    };

    // 4. Clear the cookies from the client's browser
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            // Assuming ApiResponse is a class and you need 'new'
            new ApiResponse(200, {}, "User logged out successfully")
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (inComingRefreshToken) {
        throw new ApiErrors(401, "unauthorized request")
    }



    try {
        const decodedToken = jwt.verify(
            inComingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            console.log(406, "invalid refresh token can not found");
        }

        if (inComingRefreshToken !== user.refreshToken) {
            console.log(500, "refresh token expired");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Accesstoken refreshed"
                )
            )
    } catch (error) {
      throw new ApiErrors(401,error?.message || "Invalid refreshToken")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}
