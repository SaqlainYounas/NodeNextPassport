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
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const GetUserUtility_1 = require("../Utility/GetUserUtility");
var opts = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JSON.stringify(process.env.JWT_ACCESS_TOKEN_SECRET_KEY),
};
passport_1.default.use(new passport_jwt_1.Strategy(opts, function (jwt_payload, done) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield (0, GetUserUtility_1.getSafeUserById)(jwt_payload.id);
        if (!user) {
            return done("User not Found", false);
        }
        return done(null, user);
    });
}));
