import { Router } from "express";
import { requirePortalAuth } from "../../middleware/portal-auth.js";
import {
  getPortalQuotationController,
  openPortalQuotationController,
  createPortalNegotiationController,
  confirmPortalQuotationController,
} from "./portal.controller.js";

export const portalRouter = Router();

// Protect ALL portal routes with the scoped portal JWT guard
portalRouter.use(requirePortalAuth);

portalRouter.get("/quotation", getPortalQuotationController);
portalRouter.post("/open", openPortalQuotationController);
portalRouter.post("/negotiations", createPortalNegotiationController);
portalRouter.post("/confirm", confirmPortalQuotationController);
