import type { Request, Response } from "express";
import { z } from "zod";
import { sendOk } from "../../../lib/response.js";
import { listApprovals, decideApproval } from "./approvals.service.js";

const decideApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
  editedAction: z.unknown().optional(),
});

export async function listApprovalsController(req: Request, res: Response) {
  const { status, kind, agent, quotationId } = req.query as {
    status?: string;
    kind?: string;
    agent?: string;
    quotationId?: string;
  };

  const approvals = await listApprovals({
    status,
    kind,
    agent,
    quotationId,
    user: req.user!,
  });

  return sendOk(res, approvals);
}

export async function decideApprovalController(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw Object.assign(new Error("APPROVAL_ID_REQUIRED"), { http: 400 });
  }

  const body = decideApprovalSchema.parse(req.body);
  const result = await decideApproval(id, body, req.user!);

  return sendOk(res, result, "Decision recorded.");
}
