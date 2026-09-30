import { Router } from "express";
import {
  getUser,
  Login,
  loginSchema,
  Register,
  registerSchema,
} from "../controller/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const router = Router();

router.post("/register", validateBody(registerSchema), Register);
router.post("/login", validateBody(loginSchema), Login);
router.post("/me", isAuthenticated, getUser);

export default router;
