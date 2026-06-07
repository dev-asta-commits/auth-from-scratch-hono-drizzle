import { Hono } from "hono";

import {
    login,
    logout,
    register,
    verifyEmail,
} from "@/controller/authController";
import { requireVerification } from "@/middleware/authMiddleware";

const auth = new Hono();

auth.post("/register", register);

auth.post("/verify/email", verifyEmail);

auth.post("/login", login);

auth.post("/logout", logout);

export default auth;
