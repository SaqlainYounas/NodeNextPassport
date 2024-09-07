"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RefreshAccessToken;
const VerifyRefreshToken_1 = __importDefault(require("./VerifyRefreshToken"));
const GetUserUtility_1 = require("../GetUserUtility");
const Token_1 = require("./Token");
function RefreshAccessToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //get the refresh token available in the cookies.
            const cookieRefreshToken = req.cookies.refreshToken;
            /* VALIDATE THE TOKEN GOTTEN FROM COOKIE AGAINST THE KEY */
            const { tokenDetails, userID, error } = yield (0, VerifyRefreshToken_1.default)(cookieRefreshToken);
            //If there is any error
            if (error) {
                res.status(500).json({
                    status: "Failed",
                    message: "Something went wrong, please try again later.",
                });
            }
            //If the token details are empty
            if (!tokenDetails) {
                res.status(500).json({
                    status: "Failed",
                    message: "Something went wrong, please try again later.",
                });
            }
            const existingUser = yield (0, GetUserUtility_1.getUserById)(userID);
            if (!existingUser) {
                res.status(500).json({
                    status: "Failed",
                    message: "Something went wrong, please try again later.",
                });
            }
            const userRefreshToken = yield (0, GetUserUtility_1.getUserJwtTokenById)(userID);
            /* VALIDATE THE TOKEN GOTTEN FROM COOKIE AGAINST THE USERS STORED TOKEN */
            if (cookieRefreshToken !== (userRefreshToken === null || userRefreshToken === void 0 ? void 0 : userRefreshToken.token) ||
                (userRefreshToken === null || userRefreshToken === void 0 ? void 0 : userRefreshToken.blacklisted)) {
                res.status(401).json({
                    status: "Failed",
                    message: "Unauthorized",
                });
            }
            /* ALL VALIDATIIONS PASSED: GENERATE NEW TOKENS FOR THE USER */
            const { accessToken, accessTokenExp, refreshToken, refreshTokenExp } = yield (0, Token_1.generateJwtToken)(existingUser);
            return { accessToken, accessTokenExp, refreshToken, refreshTokenExp };
        }
        catch (error) {
            console.log("ERROR", error);
            throw {
                error: "Error Refreshing Tokens",
                message: error,
            };
        }
    });
}
