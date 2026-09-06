import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { httpStatus } from "../constants/http.js";

/**
 * Maps the SCREAMING_SNAKE error codes thrown across the service layer
 * (e.g. `throw Object.assign(new Error("INVOICE_NOT_FOUND"), { http: 404 })`)
 * to human-readable messages surfaced to the client. Falls back to a
 * generic message when a code is not listed.
 */
const errorMessages: Record<string, string> = {
  BAD_CREDENTIALS: "Invalid email or password.",
  EMAIL_TAKEN: "An account with this email already exists.",
  NOT_OWNER: "You do not have permission to access this resource.",
  WRONG_APPROVER: "You are not the designated approver for this request.",
  ILLEGAL_TRANSITION: "That status change is not allowed.",
  NOT_PENDING: "This item is no longer pending.",
  INVOICE_NOT_FOUND: "Invoice not found.",
  INVOICE_ALREADY_PAID: "This invoice has already been paid.",
  INVOICE_VOID: "This invoice has been voided.",
  QUOTATION_NOT_FOUND: "Quotation not found.",
  CUSTOMER_NOT_FOUND: "Customer not found.",
  CONTACT_NOT_FOUND: "Contact not found.",
  PRODUCT_NOT_FOUND: "Product not found.",
  LINE_NOT_FOUND: "Line item not found.",
  SCHEDULE_NOT_FOUND: "Billing schedule not found.",
  NEGOTIATION_NOT_FOUND: "Negotiation not found.",
  APPROVAL_REQUEST_NOT_FOUND: "Approval request not found.",
  CANNOT_CONFIRM_EMPTY_QUOTATION:
    "A quotation must have at least one line item before it can be confirmed.",
  AI_BUDGET_EXCEEDED: "The AI monthly budget has been exhausted.",
  AGENT_MAX_STEPS: "The agent reached its maximum number of steps.",
};

type HttpError = Error & { http?: number; code?: string; status?: number };

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(httpStatus.badRequest).json({
      success: false,
      message: "Validation error.",
      issues: error.flatten(),
    });
  }

  const err = error as HttpError;
  const status =
    typeof err?.http === "number"
      ? err.http
      : typeof err?.status === "number"
        ? err.status
        : undefined;

  // Semantic errors thrown by the service layer carry an .http status and a
  // SCREAMING_SNAKE message code. Honor them instead of collapsing to 500.
  if (status && status < 500) {
    const code = err.message;
    const message = errorMessages[code] ?? code;
    logger.warn({
      code,
      status,
      method: req.method,
      url: req.originalUrl,
    });
    return res.status(status).json({
      success: false,
      message,
      code,
    });
  }

  logger.error({ error, method: req.method, url: req.originalUrl });

  return res.status(status ?? httpStatus.internalServerError).json({
    success: false,
    message: "Internal server error.",
  });
}
