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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setTokenCookies;
function setTokenCookies(_a) {
    return __awaiter(this, arguments, void 0, function* ({ res, tokenData, }) {
        const { accessToken, accessTokenExp, refreshToken, refreshTokenExp } = tokenData;
        const accessTokenMaxAge = (accessTokenExp - Math.floor(Date.now() / 1000)) * 1000;
        const refreshTokenMaxAge = (refreshTokenExp - Math.floor(Date.now() / 1000)) * 1000;
        //Set Cookie for access token
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            maxAge: accessTokenMaxAge,
        });
        //Set Cookie for refresh token
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: refreshTokenMaxAge,
        });
    });
}
