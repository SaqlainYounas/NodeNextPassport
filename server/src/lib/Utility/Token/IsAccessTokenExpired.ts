import jwt from "jsonwebtoken";
interface JwtPayload {
  exp: number;
}
export default function IsTokenExpired(token: string) {
  if (!token) {
    return true;
  }

  const decodedToken = jwt.decode(token) as JwtPayload;
  const currentTime = Date.now() / 1000;

  return decodedToken && decodedToken.exp < currentTime;
}
