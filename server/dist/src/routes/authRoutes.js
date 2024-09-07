"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("./../controllers/authController");
const accessTokenAutoRefresh_1 = __importDefault(require("../../middlewares/accessTokenAutoRefresh"));
const passport_1 = __importDefault(require("passport"));
const router = express_1.default.Router();
//api/auth/login
router.post("/login", authController_1.loginController);
//api/auth/logout
router.post("/logout", accessTokenAutoRefresh_1.default, passport_1.default.authenticate("jwt", { session: false }), authController_1.logoutController);
//api/auth/signup
router.post("/signup", authController_1.signUpController);
router.post("/verify-email", authController_1.verficationController);
router.get("/generateToken", authController_1.getNewAccessToken);
router.post("/resetPassword", authController_1.resetPasswordController);
router.post("/new-varification", authController_1.newVerificationController);
exports.default = router;
