import { Router } from "express";
import { getUser, Login, Register } from "../controller/auth.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", Register);
router.post("/login", Login);
router.post("/me",isAuthenticated, getUser);

export default router;
