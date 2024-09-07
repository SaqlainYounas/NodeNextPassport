import {User} from "@prisma/client";
import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from "passport-jwt";
import {getSafeUserById} from "../Utility/GetUserUtility";

var opts: StrategyOptionsWithoutRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JSON.stringify(process.env.JWT_ACCESS_TOKEN_SECRET_KEY),
};

passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    const user = await getSafeUserById(jwt_payload.id);
    if (!user) {
      return done("User not Found", false);
    }

    return done(null, user);
  }),
);
