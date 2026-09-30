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
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(Object.assign(new Error("Origin is not allowed"), { statusCode: 403 }));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authrouter);
app.use("/api/v1/workspace", workspacerouter);
app.use("/api/v1/incident", incidentrouter);

app.use(errorMiddleware);

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured");
  }

  await connectDB();

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});
