import {Request, Response} from "express";
import VelidateRefreshToken from "./VerifyRefreshToken";
import {UserJwtRefreshToken} from "@prisma/client";
import {getUserById, getUserJwtTokenById} from "../GetUserUtility";
import {generateJwtToken} from "./Token";
import {JwtToken} from "../../../../auth";

export default async function RefreshAccessToken(
  req: Request,
  res: Response,
): Promise<JwtToken> {
  try {
    //get the refresh token available in the cookies.
    const cookieRefreshToken = req.cookies.refreshToken;
    /* VALIDATE THE TOKEN GOTTEN FROM COOKIE AGAINST THE KEY */
    const {tokenDetails, userID, error} = await VelidateRefreshToken(
      cookieRefreshToken,
    );
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
    const existingUser = await getUserById(userID);

    if (!existingUser) {
      res.status(500).json({
        status: "Failed",
        message: "Something went wrong, please try again later.",
      });
    }
    const userRefreshToken = await getUserJwtTokenById(userID);

    /* VALIDATE THE TOKEN GOTTEN FROM COOKIE AGAINST THE USERS STORED TOKEN */
    if (
      cookieRefreshToken !== userRefreshToken?.token ||
      userRefreshToken?.blacklisted
    ) {
      res.status(401).json({
        status: "Failed",
        message: "Unauthorized",
      });
    }

    /* ALL VALIDATIIONS PASSED: GENERATE NEW TOKENS FOR THE USER */
    const {accessToken, accessTokenExp, refreshToken, refreshTokenExp} =
      await generateJwtToken(existingUser);

    return {accessToken, accessTokenExp, refreshToken, refreshTokenExp};
  } catch (error) {
    console.log("ERROR", error);
    throw {
      error: "Error Refreshing Tokens",
      message: error,
    };
  }
}
