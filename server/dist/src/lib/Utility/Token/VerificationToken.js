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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationTokenByToken = exports.getVerificationTokenByEmail = void 0;
const prisma_1 = require("../../Db/prisma");
/* Following functions are just helpers which get the token from database */
const getVerificationTokenByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verificationToken = yield prisma_1.db.verificationToken.findFirst({
            where: {
                email,
            },
        });
        return verificationToken;
    }
    catch (error) {
        return null;
    }
});
exports.getVerificationTokenByEmail = getVerificationTokenByEmail;
const getVerificationTokenByToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verificationToken = yield prisma_1.db.verificationToken.findUnique({
            where: {
                token,
            },
        });
        return verificationToken;
    }
    catch (error) {
        return null;
    }
});
exports.getVerificationTokenByToken = getVerificationTokenByToken;
