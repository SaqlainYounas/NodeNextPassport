import express from "express";
import {userProfileController} from "../controllers/userController";
import passport from "passport";
import SetAuthHeader from "../../middlewares/setAuthHeader";
import AccessTokenAutoRefresh from "../../middlewares/accessTokenAutoRefresh";
const router = express.Router();

//api/user
/* This route will not refresh the token automatically when expired */
/*
router.get(
  "/user",
  SetAuthHeader,
  passport.authenticate("jwt", {session: false}),
  userProfileController,
);
 */

//api/user
/* This route will refresh the token automatically when expired */
router.get(
  "/user",
  AccessTokenAutoRefresh,
  passport.authenticate("jwt", {session: false}),
  userProfileController,
);

export default router;
