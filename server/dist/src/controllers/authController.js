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
exports.signUpController = signUpController;
exports.verficationController = verficationController;
exports.loginController = loginController;
exports.getNewAccessToken = getNewAccessToken;
exports.logoutController = logoutController;
exports.resetPasswordController = resetPasswordController;
exports.newVerificationController = newVerificationController;
const schema_1 = require("../../schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/Db/prisma");
const GetUserUtility_1 = require("../lib/Utility/GetUserUtility");
const Token_1 = require("../lib/Utility/Token/Token");
const SendEmailUtility_1 = require("../lib/Utility/SendEmailUtility");
const GetVerificationTokenUtility_1 = require("../lib/Utility/GetVerificationTokenUtility");
const TwoFactorToken_1 = require("../lib/Utility/Token/TwoFactorToken");
const TwoFactorTokenConfirmation_1 = require("../lib/Utility/Token/TwoFactorTokenConfirmation");
const SetTokenCookies_1 = __importDefault(require("../lib/Utility/Token/SetTokenCookies"));
const RefreshAccessToken_1 = __importDefault(require("../lib/Utility/Token/RefreshAccessToken"));
const GetResetTokenUtility_1 = require("../lib/Utility/GetResetTokenUtility");
function signUpController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate request body using Zod schema
            const validation = schema_1.RegisterSchema.safeParse(req.body);
            // Check if validation failed
            if (!validation.success) {
                return res.status(400).json({
                    status: "Failed",
                    errors: validation.error.errors, // Provide specific validation errors
                });
            }
            const { name, email, password, confirmPassword } = validation.data;
            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).json({
                    status: "Failed",
                    message: "All fields are required",
                });
            }
            // Check if passwords match directly
            if (password !== confirmPassword) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Passwords must match",
                });
            }
            //Check if the user already exists
            const existingUser = yield (0, GetUserUtility_1.getUserByEmail)(email);
            if (existingUser) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Email already in Use",
                });
            }
            const salt = yield bcryptjs_1.default.genSalt(Number(process.env.SALT));
            const hashedPasword = yield bcryptjs_1.default.hash(password, salt);
            let createdUser = yield prisma_1.db.user.create({
                data: {
                    name,
                    email,
                    password: hashedPasword,
                },
            });
            const verificationToken = yield (0, Token_1.generateVerificationToken)(createdUser.email);
            yield (0, SendEmailUtility_1.sendVerificationEmail)(verificationToken.email, verificationToken.token);
            //TODO: Add "Didn't receive email, send again" button.
            res.status(200).json({
                message: "Please check your email for confirmation!",
            });
        }
        catch (error) {
            res.status(500).json({
                status: "Failed",
                message: "Unable to Register, please try again later.",
            });
        }
    });
}
function verficationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { token } = req.body;
            //Find existing token in the database
            const existingToken = yield (0, GetVerificationTokenUtility_1.getVerificationTokenByToken)(token);
            //If token doesn't exist then we return an error
            if (!existingToken) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Invalid Token", // Provide specific validation errors
                });
            }
            /* If an hour has passed since the token was generated then we return with an error that Token has expired. */
            const hasExpired = new Date(existingToken.expires) < new Date();
            if (hasExpired) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Token Expired, Register again with same email to obtain new token.", // Provide specific validation errors
                });
            }
            /* Otherwise we get the user who is trying to verify its token */
            const existingUser = yield (0, GetUserUtility_1.getUserByEmail)(existingToken.email);
            /* Edge case - if the user doesn't exist throw an error or they are already verified */
            if (!existingUser || existingUser.emailVerified) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Something went wrong, please try again later!", // Provide specific validation errors
                });
            }
            /* IF all goes well then we will update the user - we find the user using its ID and update its emailVerified and update its email if the user wants to update their email */
            yield prisma_1.db.user.update({
                where: {
                    id: existingUser.id,
                },
                data: {
                    emailVerified: new Date(),
                    email: existingToken.email,
                },
            });
            /* We remove the old verification token from our database */
            yield prisma_1.db.verificationToken.delete({
                where: {
                    id: existingToken.id,
                },
            });
            res.status(200).json({
                message: "Email Verified, You can now Login!",
            });
        }
        catch (error) {
            res.status(500).json({
                status: "Failed",
                message: "Something went wrong, please try again.",
            });
        }
    });
}
function loginController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const validatedFields = schema_1.LoginSchema.safeParse(req.body);
            // Check if validation failed
            if (!validatedFields.success) {
                return res.status(400).json({
                    status: "Failed",
                    errors: "Incorrect Login data!", // Provide specific validation errors
                });
            }
            const { email, password, code } = req.body;
            /*----------- START - Check user verification token ----------------*/
            /* Below code checks if the user has their email verified, if not -then a new verification token is generated for them and sent to their email*/
            const existingUser = yield (0, GetUserUtility_1.getUserByEmail)(email);
            if (!existingUser || !existingUser.email || !existingUser.password) {
                return res.status(400).json({
                    status: "Failed",
                    errors: "Incorrect Email or Password", // Provide specific validation errors
                });
            }
            if (!existingUser.emailVerified) {
                const verificationToken = yield (0, Token_1.generateVerificationToken)(existingUser.email);
                yield (0, SendEmailUtility_1.sendVerificationEmail)(verificationToken.email, verificationToken.token);
                return res.status(200).json({
                    status: "Success",
                    errors: "Please verify your email, a new verfication link has been sent to your email", // Provide specific validation errors
                });
            }
            /* END - Check user verification token */
            const checkPassword = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (!checkPassword) {
                //Password Validation Failed.
                return res.status(400).json({
                    status: "Failed",
                    errors: "Invalid Email or Password", // Provide specific validation errors
                });
            }
            /-------------START - Check user Two Factor Authenticaiton ---------------- */;
            /* Below code checks if the user has turned on 2Factor authentication, if yes then normal signin will break and user will be asked to input the 2fA sent to their email*/
            if (existingUser.isTwoFactorEnabled && existingUser.email) {
                if (code) {
                    //If the user has provided the two factor token then:
                    //Get the Generated and Stored token for the user.
                    const twoFactorToken = yield (0, TwoFactorToken_1.getTwoFactorTokenByEmail)(existingUser.email);
                    //if the token hasn't been generated for the user
                    if (!twoFactorToken) {
                        return res.status(400).json({
                            status: "Failed",
                            errors: "Invalid Code", // Provide specific validation errors
                        });
                    }
                    //If the code stored in the db doesn't match the provided code.
                    if (twoFactorToken.token !== code) {
                        return res.status(400).json({
                            status: "Failed",
                            errors: "Invalid Code", // Provide specific validation errors
                        });
                    }
                    //If the code is expired.
                    const hasExpired = new Date(twoFactorToken.expires) < new Date();
                    if (hasExpired) {
                        return res.status(400).json({
                            status: "Failed",
                            errors: "Token has expired, please login again to generate a new one", // Provide specific validation errors
                        });
                    }
                    //delete the expired token from the db
                    yield prisma_1.db.twoFactorToken.delete({
                        where: {
                            token: twoFactorToken.token,
                        },
                    });
                    const existingConfirmation = yield (0, TwoFactorTokenConfirmation_1.getTwoFactorConfirmationByUserId)(existingUser.id);
                    if (existingConfirmation) {
                        yield prisma_1.db.twoFactorConfirmation.delete({
                            where: {
                                id: existingConfirmation.id,
                            },
                        });
                    }
                    yield prisma_1.db.twoFactorConfirmation.create({
                        data: {
                            userId: existingUser.id,
                        },
                    });
                }
                else {
                    //If the User is not on the TwofactorScreen or If the User hasn't passed the Code required then:
                    //We will create a new token for the user
                    const twoFactorToken = yield (0, Token_1.generateTwoFactorToken)(existingUser.email);
                    //send it over the email
                    yield (0, SendEmailUtility_1.sendTwoFactorEmail)(twoFactorToken.email, twoFactorToken.token);
                    //the below retur will break the normal login process and notify frontend that it needs to change its view as the user will now input the token
                    return res.status(200).json({
                        status: "Success",
                        errors: "2FA Enabled hence required", // Provide specific validation errors
                    });
                }
            }
            /* END - Check user Two Factor Authentication */
            /* GENERATE ACCESS AND REFRESH TOKENS FOR USER AND LOGIN */
            const { accessToken, accessTokenExp, refreshToken, refreshTokenExp } = yield (0, Token_1.generateJwtToken)(existingUser);
            /* SET IN COOKIES */
            (0, SetTokenCookies_1.default)({
                res: res,
                tokenData: { accessToken, accessTokenExp, refreshToken, refreshTokenExp },
            });
            return res.status(200).json({
                status: "LOGIN SUCCESS!",
                data: {
                    User: existingUser,
                    Role: existingUser.role,
                    AccessToken: accessToken,
                    RefreshToken: refreshToken,
                    AccessTokenExpiry: accessTokenExp,
                    Authenticated: existingUser.emailVerified,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                status: "Failed",
                message: "Unable to Login, please try again later.",
            });
        }
    });
}
function getNewAccessToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Get new access token using refresh token
            const { accessToken, accessTokenExp, refreshToken, refreshTokenExp } = yield (0, RefreshAccessToken_1.default)(req, res);
            //set new tokens to cookie
            /* SET IN COOKIES */
            (0, SetTokenCookies_1.default)({
                res: res,
                tokenData: { accessToken, accessTokenExp, refreshToken, refreshTokenExp },
            });
            return res.status(200).json({
                status: "SUCCESS!",
                data: {
                    AccessToken: accessToken,
                    RefreshToken: refreshToken,
                    AccessTokenExpiry: accessTokenExp,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                status: "Failed",
                message: "Something went wrong, please try again later.",
                debug: error,
            });
        }
    });
}
function logoutController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Get the refresh token from cookie and delete it from database
            const cookieRefreshToken = req.cookies.refreshToken; //If Refresh token already exists in the Db then remove it.
            yield prisma_1.db.userJwtRefreshToken.delete({
                where: {
                    token: cookieRefreshToken,
                },
            });
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.clearCookie("is_auth");
            res.status(200).json({
                status: "Success",
                message: "User Signed out!",
            });
        }
        catch (error) {
            res.status(500).json({
                status: "Failed",
                message: "Internal Server Error: Unable to Logout, please try again later.",
            });
        }
    });
}
function resetPasswordController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate request body using Zod schema
        const validation = schema_1.ResetSchema.safeParse(req.body);
        // Check if validation failed
        if (!validation.success) {
            return res.status(400).json({
                status: "Failed",
                errors: validation.error.errors, // Provide specific validation errors
            });
        }
        const { email } = validation.data;
        /* Check if the user exists - if it doesn't send and error back */
        const existingUser = yield (0, GetUserUtility_1.getUserByEmail)(email);
        if (!existingUser) {
            return res.status(400).json({
                status: "Failed",
                errors: "Incorrect email or user doesn't exist.", // Provide specific validation errors
            });
        }
        /* Generate token and send email */
        const token = yield (0, Token_1.generatePasswordResetToken)(email);
        yield (0, SendEmailUtility_1.sendPasswordResetEmail)(token.email, token.token);
        return res.status(200).json({
            status: "Success",
            message: "Reset Password link sent to your email. It will expire in 1 hour.", // Provide specific validation errors
        });
    });
}
function newVerificationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const validatedFields = schema_1.NewPasswordSchema.safeParse(req.body);
        // Check if validation failed
        if (!validatedFields.success) {
            return res.status(400).json({
                status: "Failed",
                errors: validatedFields.error.errors, // Provide specific validation errors
            });
        }
        const { token, password } = validatedFields.data;
        if (!token) {
            return res.status(401).json({
                status: "Failed",
                errors: "Missing Token", // Provide specific validation errors
            });
        }
        /* Get existing password token. */
        const existingToken = yield (0, GetResetTokenUtility_1.getPassowordResetTokenByToken)(token);
        if (!existingToken) {
            return res.status(401).json({
                status: "Failed",
                errors: "Invalid Token", // Provide specific validation errors
            });
        }
        /* Check if it has expired */
        const hasExipred = new Date(existingToken.expires) < new Date();
        if (hasExipred) {
            return res.status(401).json({
                status: "Failed",
                errors: "Expired Token", // Provide specific validation errors
            });
        }
        /* get the user who is trying to reset their password */
        const existingUser = yield (0, GetUserUtility_1.getUserByEmail)(existingToken.email);
        /* edge case - return error if user doesn't exist */
        if (!existingUser) {
            return res.status(500).json({
                status: "Failed",
                errors: "User doesn't exist", // Provide specific validation errors
            });
        }
        /* finally hash the password and assigned to the relevent user */
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield prisma_1.db.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                password: hashedPassword,
            },
        });
        /* clear the reset token */
        yield prisma_1.db.passwordResetToken.delete({
            where: { id: existingToken.id },
        });
        return res.status(200).json({
            status: "Success",
            message: "Password Updated, please use your new password to login.", // Provide specific validation errors
        });
    });
}
