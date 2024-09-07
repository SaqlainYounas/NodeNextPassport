import {Request, Response} from "express";
import {
  RegisterSchema,
  LoginSchema,
  ResetSchema,
  NewPasswordSchema,
} from "../../schema";
import bcrypt from "bcryptjs";
import {db} from "../lib/Db/prisma";
import {getUserByEmail} from "../lib/Utility/GetUserUtility";
import {
  generateJwtToken,
  generatePasswordResetToken,
  generateTwoFactorToken,
  generateVerificationToken,
} from "../lib/Utility/Token/Token";
import {
  sendPasswordResetEmail,
  sendTwoFactorEmail,
  sendVerificationEmail,
} from "../lib/Utility/SendEmailUtility";
import {getVerificationTokenByToken} from "../lib/Utility/GetVerificationTokenUtility";
import {getTwoFactorTokenByEmail} from "../lib/Utility/Token/TwoFactorToken";
import {getTwoFactorConfirmationByUserId} from "../lib/Utility/Token/TwoFactorTokenConfirmation";
import setTokenCookies from "../lib/Utility/Token/SetTokenCookies";
import RefreshAccessToken from "../lib/Utility/Token/RefreshAccessToken";
import {getPassowordResetTokenByToken} from "../lib/Utility/GetResetTokenUtility";

export async function signUpController(req: Request, res: Response) {
  try {
    // Validate request body using Zod schema
    const validation = RegisterSchema.safeParse(req.body);

    // Check if validation failed
    if (!validation.success) {
      return res.status(400).json({
        status: "Failed",
        errors: validation.error.errors, // Provide specific validation errors
      });
    }
    const {name, email, password, confirmPassword} = validation.data;

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
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        status: "Failed",
        message: "Email already in Use",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPasword = await bcrypt.hash(password, salt);

    let createdUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPasword,
      },
    });

    const verificationToken = await generateVerificationToken(
      createdUser.email,
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    //TODO: Add "Didn't receive email, send again" button.
    res.status(200).json({
      message: "Please check your email for confirmation!",
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: "Unable to Register, please try again later.",
    });
  }
}

export async function verficationController(req: Request, res: Response) {
  try {
    const {token} = req.body;
    //Find existing token in the database
    const existingToken = await getVerificationTokenByToken(token);

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
        message:
          "Token Expired, Register again with same email to obtain new token.", // Provide specific validation errors
      });
    }

    /* Otherwise we get the user who is trying to verify its token */
    const existingUser = await getUserByEmail(existingToken.email);

    /* Edge case - if the user doesn't exist throw an error or they are already verified */
    if (!existingUser || existingUser.emailVerified) {
      return res.status(400).json({
        status: "Failed",
        message: "Something went wrong, please try again later!", // Provide specific validation errors
      });
    }

    /* IF all goes well then we will update the user - we find the user using its ID and update its emailVerified and update its email if the user wants to update their email */
    await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });

    /* We remove the old verification token from our database */
    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });

    res.status(200).json({
      message: "Email Verified, You can now Login!",
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: "Something went wrong, please try again.",
    });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const validatedFields = LoginSchema.safeParse(req.body);

    // Check if validation failed
    if (!validatedFields.success) {
      return res.status(400).json({
        status: "Failed",
        errors: "Incorrect Login data!", // Provide specific validation errors
      });
    }

    const {email, password, code} = req.body;

    /*----------- START - Check user verification token ----------------*/
    /* Below code checks if the user has their email verified, if not -then a new verification token is generated for them and sent to their email*/
    const existingUser = await getUserByEmail(email);

    if (!existingUser || !existingUser.email || !existingUser.password) {
      return res.status(400).json({
        status: "Failed",
        errors: "Incorrect Email or Password", // Provide specific validation errors
      });
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(
        existingUser.email,
      );

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token,
      );
      return res.status(200).json({
        status: "Success",
        errors:
          "Please verify your email, a new verfication link has been sent to your email", // Provide specific validation errors
      });
    }
    /* END - Check user verification token */

    const checkPassword = await bcrypt.compare(password, existingUser.password);

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
        const twoFactorToken = await getTwoFactorTokenByEmail(
          existingUser.email,
        );

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
            errors:
              "Token has expired, please login again to generate a new one", // Provide specific validation errors
          });
        }

        //delete the expired token from the db
        await db.twoFactorToken.delete({
          where: {
            token: twoFactorToken.token,
          },
        });

        const existingConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id,
        );

        if (existingConfirmation) {
          await db.twoFactorConfirmation.delete({
            where: {
              id: existingConfirmation.id,
            },
          });
        }

        await db.twoFactorConfirmation.create({
          data: {
            userId: existingUser.id,
          },
        });
      } else {
        //If the User is not on the TwofactorScreen or If the User hasn't passed the Code required then:

        //We will create a new token for the user
        const twoFactorToken = await generateTwoFactorToken(existingUser.email);

        //send it over the email
        await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token);

        //the below retur will break the normal login process and notify frontend that it needs to change its view as the user will now input the token
        return res.status(200).json({
          status: "Success",
          errors: "2FA Enabled hence required", // Provide specific validation errors
        });
      }
    }
    /* END - Check user Two Factor Authentication */

    /* GENERATE ACCESS AND REFRESH TOKENS FOR USER AND LOGIN */
    const {accessToken, accessTokenExp, refreshToken, refreshTokenExp} =
      await generateJwtToken(existingUser);

    /* SET IN COOKIES */
    setTokenCookies({
      res: res,
      tokenData: {accessToken, accessTokenExp, refreshToken, refreshTokenExp},
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
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: "Unable to Login, please try again later.",
    });
  }
}

export async function getNewAccessToken(req: Request, res: Response) {
  try {
    //Get new access token using refresh token
    const {accessToken, accessTokenExp, refreshToken, refreshTokenExp} =
      await RefreshAccessToken(req, res);

    //set new tokens to cookie
    /* SET IN COOKIES */
    setTokenCookies({
      res: res,
      tokenData: {accessToken, accessTokenExp, refreshToken, refreshTokenExp},
    });

    return res.status(200).json({
      status: "SUCCESS!",
      data: {
        AccessToken: accessToken,
        RefreshToken: refreshToken,
        AccessTokenExpiry: accessTokenExp,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: "Something went wrong, please try again later.",
      debug: error,
    });
  }
}

export async function logoutController(req: Request, res: Response) {
  try {
    //Get the refresh token from cookie and delete it from database
    const cookieRefreshToken = req.cookies.refreshToken; //If Refresh token already exists in the Db then remove it.
    await db.userJwtRefreshToken.delete({
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
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message:
        "Internal Server Error: Unable to Logout, please try again later.",
    });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  // Validate request body using Zod schema
  const validation = ResetSchema.safeParse(req.body);

  // Check if validation failed
  if (!validation.success) {
    return res.status(400).json({
      status: "Failed",
      errors: validation.error.errors, // Provide specific validation errors
    });
  }

  const {email} = validation.data;

  /* Check if the user exists - if it doesn't send and error back */
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return res.status(400).json({
      status: "Failed",
      errors: "Incorrect email or user doesn't exist.", // Provide specific validation errors
    });
  }

  /* Generate token and send email */
  const token = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(token.email, token.token);

  return res.status(200).json({
    status: "Success",
    message:
      "Reset Password link sent to your email. It will expire in 1 hour.", // Provide specific validation errors
  });
}

export async function newVerificationController(req: Request, res: Response) {
  const validatedFields = NewPasswordSchema.safeParse(req.body);

  // Check if validation failed
  if (!validatedFields.success) {
    return res.status(400).json({
      status: "Failed",
      errors: validatedFields.error.errors, // Provide specific validation errors
    });
  }

  const {token, password} = validatedFields.data;

  if (!token) {
    return res.status(401).json({
      status: "Failed",
      errors: "Missing Token", // Provide specific validation errors
    });
  }

  /* Get existing password token. */
  const existingToken = await getPassowordResetTokenByToken(token);

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
  const existingUser = await getUserByEmail(existingToken.email);

  /* edge case - return error if user doesn't exist */
  if (!existingUser) {
    return res.status(500).json({
      status: "Failed",
      errors: "User doesn't exist", // Provide specific validation errors
    });
  }

  /* finally hash the password and assigned to the relevent user */
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  /* clear the reset token */
  await db.passwordResetToken.delete({
    where: {id: existingToken.id},
  });

  return res.status(200).json({
    status: "Success",
    message: "Password Updated, please use your new password to login.", // Provide specific validation errors
  });
}
