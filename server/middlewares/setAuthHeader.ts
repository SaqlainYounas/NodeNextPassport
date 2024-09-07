/* THIS MIDDLEWARE WILL SET THE AUTHORIZATON HEADER WHICH IS PASSED ALONG WITH EVERY API CALL */
import {NextFunction, Request, Response} from "express";
import IsTokenExpired from "../src/lib/Utility/Token/IsAccessTokenExpired";

export default async function SetAuthHeader(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = req.cookies.accessToken;
    if (accessToken || !IsTokenExpired(accessToken)) {
      req.headers["authorization"] = `Bearer ${accessToken}`;
    }
    next();
  } catch (error) {
    console.error("Error Adding access token to header", error);
  }
}
