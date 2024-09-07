"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IsTokenExpired;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function IsTokenExpired(token) {
    if (!token) {
        return true;
    }
    const decodedToken = jsonwebtoken_1.default.decode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken && decodedToken.exp < currentTime;
}
