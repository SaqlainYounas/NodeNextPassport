import {v4 as uuidv4} from "uuid";
import {getVerificationTokenByEmail} from "../GetVerificationTokenUtility";
import {db} from "../../Db/prisma";
import crypto from "crypto";
import {getTwoFactorTokenByEmail} from "./TwoFactorToken";
import {ExtendedUser, JwtToken} from "./../../../../auth";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {getPassowordResetTokenByEmail} from "../GetResetTokenUtility";
dotenv.config();

/* The following function will generate a verification token based on user email, if the token already exists it will be deleted and replace with new one. */
export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); //set expiry to 1 hour.

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.verificationToken.delete({where: {id: existingToken.id}});
  }

  /* This verificationToken Database is a dummy table which stores the created token. The token is deleted when the user verifies their email. That is done in NewVerificationAction file. */
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return verificationToken;
};

//This function will generate the token for the provided user's email.
export const generateTwoFactorToken = async (email: string) => {
  //make a token and create an expiry of 1 hour
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  //see if 2Factor token already exists for the user, if so, delete it.
  const existingToken = await getTwoFactorTokenByEmail(email);
  if (existingToken) {
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  //finally create a new token and return it.
  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return twoFactorToken;
};

/* THIS FUNCTION WILL GENERATE JWT TOKENS FOR PROVIDED USER */
export const generateJwtToken = async (
  user: ExtendedUser,
): Promise<JwtToken> => {
  try {
    const payload = {id: user.id, role: user.role};

    const accessTokenExp = Math.floor(Date.now() / 1000) + 100; //Set Exp to 100 second from now.

    const accessToken = jwt.sign(
      {...payload, exp: accessTokenExp},
      JSON.stringify(process.env.JWT_ACCESS_TOKEN_SECRET_KEY),
    );

    const refreshTokenExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5;

    const refreshToken = jwt.sign(
      {...payload, exp: refreshTokenExp},
      JSON.stringify(process.env.JWT_REFRESH_TOKEN_SECRET_KEY),
    );

    //If Refresh token already exists in the Db then remove it.
    const userRefreshToken = await db.userJwtRefreshToken.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (userRefreshToken) {
      await db.userJwtRefreshToken.delete({
        where: {
          userId: user.id,
        },
      });
    }

    //Now save the newly created refresh token
    await db.userJwtRefreshToken.create({
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
  } catch (error) {
    throw {
      error: "Couldn't create Tokens",
      message: error,
    };
  }
};

/* The following function will generate a verification token based on user email, if the token already exists it will be deleted and replace with new one. */
export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); //set expiry to 1 hour.

  //if the user already has a token, but they are requesting a new one so we we clear the old one.
  const existingToken = await getPassowordResetTokenByEmail(email);

  if (existingToken) {
    await db.passwordResetToken.delete({where: {id: existingToken.id}});
  }

  /* This verificationToken Database is a dummy table which stores the created token. The token is deleted when the user verifies their email. That is done in NewVerificationAction file. */
  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return passwordResetToken;
};
