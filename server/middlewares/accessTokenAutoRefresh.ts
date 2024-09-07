/* THIS MIDDLEWARE WILL SET THE AUTHORIZATON HEADER AND REFRESH IT AS WELL. */
import {NextFunction, Request, Response} from "express";
import IsTokenExpired from "../src/lib/Utility/Token/IsAccessTokenExpired";
import RefreshAccessToken from "../src/lib/Utility/Token/RefreshAccessToken";
import setTokenCookies from "../src/lib/Utility/Token/SetTokenCookies";

export default async function AccessTokenAutoRefresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = req.cookies.accessToken;

    if (accessToken || !IsTokenExpired(accessToken)) {
      req.headers["authorization"] = `Bearer ${accessToken}`;
    }

    if (!accessToken || IsTokenExpired(accessToken)) {
      const CookieRefreshToken = req.cookies.refreshToken;
      if (!CookieRefreshToken) {
        throw new Error("Refresh Token Missing");
      }

      //Get new access token using refresh token
      const {
        accessToken: newAccessToken,
        accessTokenExp,
        refreshToken,
        refreshTokenExp,
      } = await RefreshAccessToken(req, res);

      //set new tokens to cookie
      /* SET IN COOKIES */
      setTokenCookies({
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
  } catch (error: any) {
    console.error("Error Adding access token to header", error.message);

    res.status(401).json({
      error: "unauthorized",
      message: "Refresh token is missing",
    });
  }
}
