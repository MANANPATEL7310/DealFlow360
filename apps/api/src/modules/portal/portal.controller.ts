import type { Request, Response } from "express";
import { httpStatus } from "../../constants/http.js";
import { sendOk, sendCreated, sendError } from "../../lib/response.js";
import { portalService } from "./portal.service.js";

export async function getPortalQuotationController(req: Request, res: Response) {
  try {
    const quotationId = req.portal?.quotationId;
    if (!quotationId) {
      sendError(res, httpStatus.unauthorized, "Missing portal quotation scope.");
      return;
    }

    const data = portalService.getQuotation(quotationId);
    sendOk(res, data);
  } catch (error: any) {
    sendError(res, httpStatus.badRequest, error.message || "Failed to load portal quotation.");
  }
}

export async function openPortalQuotationController(req: Request, res: Response) {
  try {
    const quotationId = req.portal?.quotationId;
    if (!quotationId) {
      sendError(res, httpStatus.unauthorized, "Missing portal quotation scope.");
      return;
    }

    const data = portalService.markOpened(quotationId);
    sendOk(res, data);
  } catch (error: any) {
    sendError(res, httpStatus.badRequest, error.message || "Failed to mark quotation opened.");
  }
}

export async function createPortalNegotiationController(req: Request, res: Response) {
  try {
    const quotationId = req.portal?.quotationId;
    const contactId = req.portal?.contactId;

    if (!quotationId || !contactId) {
      sendError(res, httpStatus.unauthorized, "Missing portal authentication context.");
      return;
    }

    const data = portalService.createNegotiation(quotationId, contactId, req.body);
    sendCreated(res, data);
  } catch (error: any) {
    sendError(res, httpStatus.badRequest, error.message || "Failed to submit negotiation request.");
  }
}

export async function confirmPortalQuotationController(req: Request, res: Response) {
  try {
    const quotationId = req.portal?.quotationId;
    if (!quotationId) {
      sendError(res, httpStatus.unauthorized, "Missing portal quotation scope.");
      return;
    }

    const data = portalService.confirmQuotation(quotationId);
    sendOk(res, data);
  } catch (error: any) {
    sendError(res, httpStatus.badRequest, error.message || "Failed to confirm quotation.");
  }
}
