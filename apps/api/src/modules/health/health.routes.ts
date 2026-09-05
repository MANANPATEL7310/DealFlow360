import { createRouter } from "../../lib/create-router.js";
import { healthController } from "./health.controller.js";

export const healthRouter = createRouter();

healthRouter.get("/", healthController);
