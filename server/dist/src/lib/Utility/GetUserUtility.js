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
exports.getUserJwtTokenById = exports.getSafeUserById = exports.getUserById = exports.getUserByEmail = void 0;
const prisma_1 = require("../Db/prisma");
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.db.user.findUnique({
            where: {
                email,
            },
        });
        return user;
    }
    catch (error) {
        return null;
    }
});
exports.getUserByEmail = getUserByEmail;
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.db.user.findUnique({
            where: {
                id,
            },
        });
        return user;
    }
    catch (error) {
        return null;
    }
});
exports.getUserById = getUserById;
const getSafeUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.db.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                isTwoFactorEnabled: true,
                Conversation: true,
                Message: true,
                accounts: true,
                // Password is excluded here
            },
        });
        return user;
    }
    catch (error) {
        return null;
    }
});
exports.getSafeUserById = getSafeUserById;
const getUserJwtTokenById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.db.userJwtRefreshToken.findUnique({
            where: {
                userId: id,
            },
        });
        return user;
    }
    catch (error) {
        return null;
    }
});
exports.getUserJwtTokenById = getUserJwtTokenById;
