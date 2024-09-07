import express from "express";
import dotenv from "dotenv";
import "./lib/Passport/PassportJwtStrategy";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
const corsOptions = {
  origin: process.env.FRONTEND_HOST,
  credentials: true,
  optionsSuccessStatus: 200,
};

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy: "cross-origin"}));
app.use(morgan("common"));
app.use(cookieParser());
app.use(cors(corsOptions));
/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api", userRoutes);
/* SERVER */
const port = Number(process.env.port);
app.listen(port, "0.0.0.0", () => {
  console.log("Server running on port ", port);
});
