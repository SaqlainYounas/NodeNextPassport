import {Response} from "express";
import {JwtToken} from "../../../../auth";

interface SetTokenCookies {
  res: Response;
  tokenData: JwtToken;
}
export default async function setTokenCookies({
  res,
  tokenData,
}: SetTokenCookies) {
  const {accessToken, accessTokenExp, refreshToken, refreshTokenExp} =
    tokenData;

  const accessTokenMaxAge =
    (accessTokenExp - Math.floor(Date.now() / 1000)) * 1000;

  const refreshTokenMaxAge =
    (refreshTokenExp - Math.floor(Date.now() / 1000)) * 1000;

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
}
