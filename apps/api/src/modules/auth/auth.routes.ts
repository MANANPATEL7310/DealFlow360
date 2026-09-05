// apps/api/src/modules/auth/auth.routes.ts
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  loginController,
  meController,
  registerController,
} from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const authRouter = createRouter();

// Public routes
authRouter.post(
  "/register",
  validateRequest(registerSchema),
  registerController,
);
authRouter.post("/login", validateRequest(loginSchema), loginController);

// Protected route — must be logged in
authRouter.get("/me", requireAuth, meController);
