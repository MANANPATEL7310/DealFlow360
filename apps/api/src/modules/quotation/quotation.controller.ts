// apps/api/src/modules/quotation/quotation.controller.ts
import type { Request, Response } from "express";
import { httpStatus } from "../../constants/http.js";
import { sendCreated, sendError, sendOk } from "../../lib/response.js";
import { decideApproval } from "./approval.service.js";
import {
  answerNegotiation,
  listNegotiations,
  sendToCustomer,
} from "./send.service.js";
import {
  addLine,
  confirmQuotation,
  createQuotation,
  deleteLine,
  evaluateQuotationRisk,
  getQuotation,
  listQuotations,
  updateLine,
} from "./quotation.service.js";

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

// The database identifier is the authoritative quotation reference. Expose it
// under the legacy client contract until a separate human-readable number is
// added as a persisted column.
function toQuotationDto<T extends { id: string }>(quotation: T) {
  return { ...quotation, quotationNumber: quotation.id };
}

export async function riskController(req: Request, res: Response) {
  try {
    return sendOk(
      res,
      await evaluateQuotationRisk(req.params.id as string, {
        id: req.user!.sub,
        role: req.user!.role,
      }),
    );
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listQuotationsController(req: Request, res: Response) {
  try {
    const quotations = await listQuotations(
      {
        status: req.query.status as string | undefined,
        customerId: req.query.customerId as string | undefined,
      },
      { id: req.user!.sub, role: req.user!.role },
    );
    return sendOk(res, quotations.map(toQuotationDto));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getQuotationController(req: Request, res: Response) {
  try {
    const quotation = await getQuotation(req.params.id as string, {
      id: req.user!.sub,
      role: req.user!.role,
    });
    return sendOk(res, toQuotationDto(quotation));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function createQuotationController(req: Request, res: Response) {
  try {
    const quotation = await createQuotation(req.body, req.user!.sub);
    return sendCreated(
      res,
      toQuotationDto(quotation),
      "Quotation draft created.",
    );
  } catch (e) {
    return handleError(res, e);
  }
}

export async function addLineController(req: Request, res: Response) {
  try {
    const line = await addLine(req.params.id as string, req.body, {
      id: req.user!.sub,
      role: req.user!.role,
    });
    return sendCreated(res, line, "Line added successfully.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateLineController(req: Request, res: Response) {
  try {
    const line = await updateLine(
      req.params.id as string,
      req.params.lineId as string,
      req.body,
      { id: req.user!.sub, role: req.user!.role },
    );
    return sendOk(res, line, "Line updated successfully.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteLineController(req: Request, res: Response) {
  try {
    const result = await deleteLine(
      req.params.id as string,
      req.params.lineId as string,
      { id: req.user!.sub, role: req.user!.role },
    );
    return sendOk(res, result, "Line deleted successfully.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function confirmController(req: Request, res: Response) {
  try {
    const result = await confirmQuotation(
      req.params.id as string,
      req.user!.sub,
    );
    return sendOk(res, result, "Quotation confirmed.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function decisionController(req: Request, res: Response) {
  try {
    const result = await decideApproval(
      req.params.id as string,
      { id: req.user!.sub, role: req.user!.role },
      req.body,
    );
    return sendOk(res, result, "Approval decision recorded.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function sendToCustomerController(req: Request, res: Response) {
  try {
    const result = await sendToCustomer(
      req.params.id as string,
      req.user!.sub,
      req.body.contactId,
    );
    return sendOk(res, result, "Quotation sent to customer.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listNegotiationsController(req: Request, res: Response) {
  try {
    const negotiations = await listNegotiations(req.params.id as string);
    return sendOk(res, negotiations);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function answerNegotiationController(req: Request, res: Response) {
  try {
    const result = await answerNegotiation(
      req.params.id as string,
      req.params.negId as string,
      req.user!.sub,
      req.body.status,
    );
    return sendOk(
      res,
      result,
      `Negotiation request marked as ${req.body.status}.`,
    );
  } catch (e) {
    return handleError(res, e);
  }
}
