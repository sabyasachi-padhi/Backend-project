// src/routes/users.routes.js

import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },

        {
            name:"coverdImage", // CHANGE this line: Change 'coverImage' to 'coverdImage'
            maxCount:1
        }
        //middleware request ke ander aur field add karta he.
    ]),
    registerUser)
// router.route("/login").post(login)

export default router;
