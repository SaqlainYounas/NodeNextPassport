"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
require("./lib/Passport/PassportJwtStrategy");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const corsOptions = {
    origin: process.env.FRONTEND_HOST,
    credentials: true,
    optionsSuccessStatus: 200,
};
/* CONFIGURATIONS */
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)(corsOptions));
/* ROUTES */
app.use("/api/auth", authRoutes_1.default);
app.use("/api/message", messageRoutes_1.default);
app.use("/api", userRoutes_1.default);
/* SERVER */
const port = Number(process.env.port);
app.listen(port, "0.0.0.0", () => {
    console.log("Server running on port ", port);
});
