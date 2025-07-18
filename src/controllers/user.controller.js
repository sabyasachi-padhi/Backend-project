
import { ApiErrors } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/User.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)


        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // Don't forget await here!

        return { accessToken, refreshToken } // Return them correctly
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
    // This requires req.user._id to be populated by verifyJWT middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!inComingRefreshToken) {
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
        throw new ApiErrors(401, error?.message || "Invalid refreshToken")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body

    if (!(newPassword == confPassword)) {
        throw new ApiErrors(500, "password can not matched")
    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiErrors(400, "Invalid old password")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "password is sucessfully changed"
        ))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "curren user sucessfully fetched")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    // 1. Basic validation for incoming data
    if (!fullName && !email) {
        throw new ApiErrors(400, "Please provide fields to update (fullName, email).");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        }, { new: true }.select("-password")
    )


    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Account details updated sucessfuly'))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    //delete old image assinment.
    if (!avatar.url) {
        throw new ApiErrors(406, "error while uploading on avatar")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        }, { new: true }.select("-password")
    )

    if (!user) {
        throw new ApiErrors(504, "Avatar can not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image uploaded sucessfully"))

})

const updateUserCoverdImage = asyncHandler(async (req, res) => {
    const coverdImageLocalPath = req.user?.path

    if (!coverdImageLocalPath) {
        throw new ApiErrors(500, "Coverd image is missing")
    }

    const coverdImage = await uploadOnCloudinary(coverdImageLocalPath)

    if (!coverdImage.url) {
        throw new ApiErrors(506, "missing url of coverd image")
    }


    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverdImage: coverdImage.url
            }
        }, { new: true }.select("-password")
    )

    if (!user) {
        throw new ApiErrors(500, "coverimage can not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Coverd image uploaded sucessfully")
        )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username.trim()) {
        throw new ApiErrors(404, "username is missing")
    }

    const channel = await User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    }, {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    }, {
        $lookup: {
            from: 'subscriptions',
            localField: "_id",
            foreignField: "subscribers",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subscriberCount: {
                $size: "$subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscribedTo"
            },

            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscribe"] },
                    then: true,
                    else: false,
                }
            }
        }
    },

    {
        $project: {
            fullName: 1,
            username: 1,
            email: 1,
            avatar: 1,
            coverdImage: 1,
            subscriberCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
        }
    }
    ])

    console.log(channel);

    if (!channel?.length) {
        throw new ApiErrors(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "channel sucessfully fetched")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);


    if (!user || user.length === 0) {
        throw new ApiErrors(404, "Watch history cannot be fetched: User not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse( 
                200,
                user[0].watchHistory, // user[0] is safe now because of the check above
                "Watch history seen successfully"
            )
        );
});   

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverdImage,
    getUserChannelProfile,
    getWatchHistory
}
