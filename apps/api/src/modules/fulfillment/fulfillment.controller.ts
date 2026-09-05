import type { Request, Response } from "express";
import { httpStatus } from "../../constants/http.js";
import { sendError, sendOk } from "../../lib/response.js";
import {
  acceptPlan,
  consolidateBackorder,
  getFulfillmentPlan,
  moveToFulfillment,
  overridePlan,
} from "./fulfillment.service.js";

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

export async function getFulfillmentPlanController(
  req: Request,
  res: Response,
) {
  try {
    const plan = await getFulfillmentPlan(req.params.id as string, {
      id: req.user!.sub,
      role: req.user!.role,
    });
    return sendOk(res, plan);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function moveToFulfillmentController(req: Request, res: Response) {
  try {
    const plan = await moveToFulfillment(
      req.params.id as string,
      req.user!.sub,
    );
    return sendOk(res, plan, "Fulfillment plan generated.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function acceptPlanController(req: Request, res: Response) {
  try {
    const plan = await acceptPlan(req.params.id as string, req.user!.sub);
    return sendOk(res, plan, "Fulfillment plan accepted.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function overridePlanController(req: Request, res: Response) {
  try {
    const plan = await overridePlan(
      req.params.id as string,
      req.user!.sub,
      req.body,
    );
    return sendOk(res, plan, "Fulfillment plan overridden.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function consolidateBackorderController(
  req: Request,
  res: Response,
) {
  try {
    const backorder = await consolidateBackorder(
      req.params.id as string,
      req.params.backorderId as string,
      req.user!.sub,
    );
    return sendOk(res, backorder, "Backorder consolidated.");
  } catch (e) {
    return handleError(res, e);
  }
}
