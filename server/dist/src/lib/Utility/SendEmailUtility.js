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
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendTwoFactorEmail = sendTwoFactorEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
/* Use Resend to send the verification email along with the token created while Registering */
function sendVerificationEmail(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const confirmLink = `http://localhost:5000/auth/new-varification?token=${token}`;
        try {
            const data = yield resend.emails.send({
                from: "onboarding@resend.dev",
                to: email,
                subject: "Confirm your email",
                html: `<p>Click <a href="${confirmLink}">here</a> to confirm email. You have 1 hour before this link expires.</p>`,
            });
            return data;
        }
        catch (error) {
            console.error(error);
        }
    });
}
/* Use Resend to Send the 2FA Token for login */
function sendTwoFactorEmail(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield resend.emails.send({
                from: "onboarding@resend.dev",
                to: email,
                subject: "Login Auth Code",
                html: `<p>Your 2FA code: ${token}.</p>`,
            });
            return data;
        }
        catch (error) {
            console.error(error);
        }
    });
}
function sendPasswordResetEmail(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const resetLink = `http://localhost:5000/auth/new-password?token=${token}`;
        yield resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Confirm your email",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
        });
    });
}
