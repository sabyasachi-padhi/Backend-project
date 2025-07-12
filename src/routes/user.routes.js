// src/routes/users.routes.js

import { Router } from "express";
import {registerUser,loginUser,logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },

        {
            name:"coverdImage",
            maxCount:1
        }
        //middleware request ke ander aur field add karta he.
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured route
router.route("/logout").post(verifyJWT,logoutUser)

export default router;
