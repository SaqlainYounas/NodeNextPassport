"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const passport_1 = __importDefault(require("passport"));
const accessTokenAutoRefresh_1 = __importDefault(require("../../middlewares/accessTokenAutoRefresh"));
const router = express_1.default.Router();
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
router.get("/user", accessTokenAutoRefresh_1.default, passport_1.default.authenticate("jwt", { session: false }), userController_1.userProfileController);
exports.default = router;
