import express from "express";
import {
  loginController,
  signUpController,
  logoutController,
  verficationController,
  getNewAccessToken,
  resetPasswordController,
  newVerificationController,
} from "./../controllers/authController";
import AccessTokenAutoRefresh from "../../middlewares/accessTokenAutoRefresh";
import passport from "passport";
const router = express.Router();

//api/auth/login
router.post("/login", loginController);

//api/auth/logout
router.post(
  "/logout",
  AccessTokenAutoRefresh,
  passport.authenticate("jwt", {session: false}),
  logoutController,
);

//api/auth/signup
router.post("/signup", signUpController);

router.post("/verify-email", verficationController);

router.get("/generateToken", getNewAccessToken);

router.post("/resetPassword", resetPasswordController);

router.post("/new-varification", newVerificationController);

export default router;
