// apps/api/src/modules/portal/portal.controller.ts
import type { Request, Response } from "express";
import { httpStatus } from "../../constants/http.js";
import { sendCreated, sendError, sendOk } from "../../lib/response.js";
import {
  getPortalQuotation,
  openPortal,
  portalConfirm,
  submitNegotiation,
} from "./portal.service.js";

function handleError(res: Response, error: unknown) {
  const err = error as Error & { http?: number };
  if (err.http) {
    return sendError(res, err.http, err.message);
  }
  return sendError(
    res,
    httpStatus.internalServerError,
    err.message || "Internal server error.",
  );
}

export async function getPortalQuotationController(
  req: Request,
  res: Response,
) {
  try {
    const data = await getPortalQuotation(req.portal!.quotationId);
    return sendOk(res, data);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function openPortalController(req: Request, res: Response) {
  try {
    const data = await openPortal(
      req.portal!.quotationId,
      req.portal!.contactId,
    );
    return sendOk(res, data);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function submitNegotiationController(req: Request, res: Response) {
  try {
    const data = await submitNegotiation(
      req.portal!.quotationId,
      req.portal!.contactId,
      req.body,
    );
    return sendCreated(res, data, "Negotiation request submitted.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function confirmPortalController(req: Request, res: Response) {
  try {
    const data = await portalConfirm(
      req.portal!.quotationId,
      req.portal!.contactId,
    );
    return sendOk(res, data);
  } catch (e) {
    return handleError(res, e);
  }
}
