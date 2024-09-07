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
exports.default = AccessTokenAutoRefresh;
const IsAccessTokenExpired_1 = __importDefault(require("../src/lib/Utility/Token/IsAccessTokenExpired"));
const RefreshAccessToken_1 = __importDefault(require("../src/lib/Utility/Token/RefreshAccessToken"));
const SetTokenCookies_1 = __importDefault(require("../src/lib/Utility/Token/SetTokenCookies"));
function AccessTokenAutoRefresh(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accessToken = req.cookies.accessToken;
            if (accessToken || !(0, IsAccessTokenExpired_1.default)(accessToken)) {
                req.headers["authorization"] = `Bearer ${accessToken}`;
            }
            if (!accessToken || (0, IsAccessTokenExpired_1.default)(accessToken)) {
                const CookieRefreshToken = req.cookies.refreshToken;
                if (!CookieRefreshToken) {
                    throw new Error("Refresh Token Missing");
                }
                //Get new access token using refresh token
                const { accessToken: newAccessToken, accessTokenExp, refreshToken, refreshTokenExp, } = yield (0, RefreshAccessToken_1.default)(req, res);
                //set new tokens to cookie
                /* SET IN COOKIES */
                (0, SetTokenCookies_1.default)({
                    res: res,
                    tokenData: {
                        accessToken: newAccessToken,
                        accessTokenExp,
                        refreshToken,
                        refreshTokenExp,
                    },
                });
                req.headers["authorization"] = `Bearer ${newAccessToken}`;
            }
            next();
        }
        catch (error) {
            console.error("Error Adding access token to header", error.message);
            res.status(401).json({
                error: "unauthorized",
                message: "Refresh token is missing",
            });
        }
    });
}
