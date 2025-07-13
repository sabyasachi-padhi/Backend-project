import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";  
import jwt from "jsonwebtoken"
import { User } from "../models/User.model.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
   try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

      if (!token) {
         throw new ApiErrors(404, "unauthorized authorization")
      }

      const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decodeToken?._id).select("-password -refreshToken")

      if (!user) {
         // discuss about frontend
         throw new ApiErrors(401, "Invalid access token")
      }

      req.user = user
      next()

   } catch (error) {
      throw new ApiErrors(401, error ?.mesaage || "Invalid refershToken")
   }

})