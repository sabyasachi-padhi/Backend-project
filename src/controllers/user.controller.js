import { ApiErrors } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/User.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message:"hyy sabyasachi"
  // })
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body
  console.log("email", email);
  if ([fullName, email, username, password].some(field => field?.trim() === "")) {
    throw new ApiErrors(400, "All fields are required");
  }
  // 3. Check if user already exists: username, email

  //use $ with operators.
  const existedUser = User.findOne({
    $or: [{ username }, { email }]
  })
  console.log(existedUser);
  if (existedUser) {
    throw new ApiErrors(409, "User with email or username already exists")
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avtar is required")
  }

   // 4. (Implicitly checked by avatarLocalPath/coverImageLocalPath)
    // 5. Upload to Cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverdImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiErrors(500, "Avatar upload failed. Please try again.")
  }

   // 6. Create user object - create entry in DB
  const user = await User.create({
    username:username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url, // Save the URL from Cloudinary
    coverImage: coverdImage?.url || "", // Save URL if exists, else empty string
    // watchHistory and refreshToken will be initialized by default schema values
  })

   //  Remove password and refresh token field from response
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
    
})

export default registerUser