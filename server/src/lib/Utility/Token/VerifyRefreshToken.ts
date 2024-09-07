import jwt from "jsonwebtoken";
import {db} from "../../Db/prisma";
import {UserJwtRefreshToken} from "@prisma/client";

export default async function VelidateRefreshToken(token: string) {
  try {
    const privatekey = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;

    //Find the token in the database.
    const tokenStoredInDatabase = await db.userJwtRefreshToken.findUnique({
      where: {token},
    });

    if (!tokenStoredInDatabase) {
      throw {
        error: true,
        message: "Invalid Refresh Token",
      };
    }

    //Verify the provided JWT token
    const tokenDetails = jwt.verify(token, JSON.stringify(privatekey));

    return {
      tokenDetails,
      userID: tokenStoredInDatabase.userId,
      error: false,
      message: "Valid Refresh Token",
    };
  } catch (error) {
    throw {error: true, message: "Invalid Refresh Token"};
  }
}
