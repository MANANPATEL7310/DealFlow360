// apps/api/src/modules/portal/portal.routes.ts
import { submitNegotiationSchema } from "@template/shared";
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requirePortalAuth } from "../../middleware/require-portal-auth.js";
import * as c from "./portal.controller.js";

export const portalRouter = createRouter();

// ALL portal routes require portal authentication and use req.portal claims (no :id in URL)
portalRouter.use(requirePortalAuth);

portalRouter.get("/quotation", c.getPortalQuotationController);
portalRouter.post("/open", c.openPortalController);
portalRouter.post(
  "/negotiations",
  validateRequest(submitNegotiationSchema),
  c.submitNegotiationController,
);
portalRouter.post("/confirm", c.confirmPortalController);
