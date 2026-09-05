import { validateRequest } from "../../lib/validate-request.js";
import { createRouter } from "../../lib/create-router.js";
import { loginController } from "./auth.controller.js";
import { loginInputSchema } from "./auth.schema.js";

export const authRouter = createRouter();

authRouter.post("/login", validateRequest(loginInputSchema), loginController);
