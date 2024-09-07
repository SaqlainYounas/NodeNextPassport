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
exports.generatePasswordResetToken = exports.generateJwtToken = exports.generateTwoFactorToken = exports.generateVerificationToken = void 0;
const uuid_1 = require("uuid");
const GetVerificationTokenUtility_1 = require("../GetVerificationTokenUtility");
const prisma_1 = require("../../Db/prisma");
const crypto_1 = __importDefault(require("crypto"));
const TwoFactorToken_1 = require("./TwoFactorToken");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const GetResetTokenUtility_1 = require("../GetResetTokenUtility");
dotenv_1.default.config();
/* The following function will generate a verification token based on user email, if the token already exists it will be deleted and replace with new one. */
const generateVerificationToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, uuid_1.v4)();
    const expires = new Date(new Date().getTime() + 3600 * 1000); //set expiry to 1 hour.
    const existingToken = yield (0, GetVerificationTokenUtility_1.getVerificationTokenByEmail)(email);
    if (existingToken) {
        yield prisma_1.db.verificationToken.delete({ where: { id: existingToken.id } });
    }
    /* This verificationToken Database is a dummy table which stores the created token. The token is deleted when the user verifies their email. That is done in NewVerificationAction file. */
    const verificationToken = yield prisma_1.db.verificationToken.create({
        data: {
            email,
            token,
            expires,
        },
    });
    return verificationToken;
});
exports.generateVerificationToken = generateVerificationToken;
//This function will generate the token for the provided user's email.
const generateTwoFactorToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    //make a token and create an expiry of 1 hour
    const token = crypto_1.default.randomInt(100000, 1000000).toString();
    const expires = new Date(new Date().getTime() + 3600 * 1000);
    //see if 2Factor token already exists for the user, if so, delete it.
    const existingToken = yield (0, TwoFactorToken_1.getTwoFactorTokenByEmail)(email);
    if (existingToken) {
        yield prisma_1.db.twoFactorToken.delete({
            where: {
                id: existingToken.id,
            },
        });
    }
    //finally create a new token and return it.
    const twoFactorToken = yield prisma_1.db.twoFactorToken.create({
        data: {
            email,
            token,
            expires,
        },
    });
    return twoFactorToken;
});
exports.generateTwoFactorToken = generateTwoFactorToken;
/* THIS FUNCTION WILL GENERATE JWT TOKENS FOR PROVIDED USER */
const generateJwtToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = { id: user.id, role: user.role };
        const accessTokenExp = Math.floor(Date.now() / 1000) + 100; //Set Exp to 100 second from now.
        const accessToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { exp: accessTokenExp }), JSON.stringify(process.env.JWT_ACCESS_TOKEN_SECRET_KEY));
        const refreshTokenExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5;
        const refreshToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { exp: refreshTokenExp }), JSON.stringify(process.env.JWT_REFRESH_TOKEN_SECRET_KEY));
        //If Refresh token already exists in the Db then remove it.
        const userRefreshToken = yield prisma_1.db.userJwtRefreshToken.findUnique({
            where: {
                userId: user.id,
            },
        });
        if (userRefreshToken) {
            yield prisma_1.db.userJwtRefreshToken.delete({
                where: {
                    userId: user.id,
                },
            });
        }
        //Now save the newly created refresh token
        yield prisma_1.db.userJwtRefreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                blacklisted: false,
            },
        });
        return {
            accessToken,
            accessTokenExp,
            refreshToken,
            refreshTokenExp,
        };
    }
    catch (error) {
        throw {
            error: "Couldn't create Tokens",
            message: error,
        };
    }
});
exports.generateJwtToken = generateJwtToken;
/* The following function will generate a verification token based on user email, if the token already exists it will be deleted and replace with new one. */
const generatePasswordResetToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, uuid_1.v4)();
    const expires = new Date(new Date().getTime() + 3600 * 1000); //set expiry to 1 hour.
    //if the user already has a token, but they are requesting a new one so we we clear the old one.
    const existingToken = yield (0, GetResetTokenUtility_1.getPassowordResetTokenByEmail)(email);
    if (existingToken) {
        yield prisma_1.db.passwordResetToken.delete({ where: { id: existingToken.id } });
    }
    /* This verificationToken Database is a dummy table which stores the created token. The token is deleted when the user verifies their email. That is done in NewVerificationAction file. */
    const passwordResetToken = yield prisma_1.db.passwordResetToken.create({
        data: {
            email,
            token,
            expires,
        },
    });
    return passwordResetToken;
});
exports.generatePasswordResetToken = generatePasswordResetToken;
