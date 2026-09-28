import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import errorMiddleware from "./middleware/error.middleware.js";
import authrouter from "./router/auth.router.js";
import workspacerouter from "./router/workspace.router.js";
import incidentrouter from "./router/incident.router.js";
const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

connectDB();

app.use("/api/v1/auth", authrouter);
app.use("/api/v1/workspace", workspacerouter);
app.use("/api/v1/incident", incidentrouter);

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
