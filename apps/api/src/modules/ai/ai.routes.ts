import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  getAiStatus,
  listApprovalRequests,
  decideApprovalRequest,
  listAgentRuns,
  getContextualSuggestions,
  getDiscountApprovalReview,
  evaluateNegotiationCounter,
  getAiUpsellRecommendations,
  getAiDealHealthTriage,
  draftAiNudge,
  getAiFulfillmentProposal,
  getAiBillingExplanation,
  draftAiCreditNote,
} from "./ai.service.js";
import {
  HitlApprovalDecisionSchema,
  AiDraftCreditNoteRequestSchema,
} from "@template/shared";

export const aiRouter = createRouter();

aiRouter.use(requireAuth);

aiRouter.get("/status", async (_req, res, next) => {
  try {
    const status = await getAiStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

aiRouter.get("/approvals", async (req, res, next) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const items = await listApprovalRequests(status);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/approvals/:id/decision", async (req, res, next) => {
  try {
    const parsed = HitlApprovalDecisionSchema.parse(req.body);
    const userId = req.user?.sub ?? "user";
    const result = await decideApprovalRequest(req.params.id, parsed, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

aiRouter.get("/runs", async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const runs = await listAgentRuns(limit);
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/contextual", async (req, res, next) => {
  try {
    const path = typeof req.body?.path === "string" ? req.body.path : "";
    const suggestions = await getContextualSuggestions(path);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/discount-review", async (req, res, next) => {
  try {
    const quotationId =
      typeof req.body?.quotationId === "string" ? req.body.quotationId : "";
    const review = await getDiscountApprovalReview(quotationId);
    res.json(review);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/negotiation-evaluate", async (req, res, next) => {
  try {
    const quotationId =
      typeof req.body?.quotationId === "string" ? req.body.quotationId : "";
    const counterDiscountPct = Number(req.body?.counterDiscountPct) || 0;
    const lineId =
      typeof req.body?.lineId === "string" ? req.body.lineId : undefined;
    const evaluation = await evaluateNegotiationCounter(
      quotationId,
      counterDiscountPct,
      lineId,
    );
    res.json(evaluation);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/upsell-recommendations", async (req, res, next) => {
  try {
    const quotationId =
      typeof req.body?.quotationId === "string" ? req.body.quotationId : "";
    const recommendations = await getAiUpsellRecommendations(quotationId);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/deal-health-triage", async (_req, res, next) => {
  try {
    const triage = await getAiDealHealthTriage();
    res.json(triage);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/draft-nudge", async (req, res, next) => {
  try {
    const alertId =
      typeof req.body?.alertId === "string" ? req.body.alertId : "";
    const tone = typeof req.body?.tone === "string" ? req.body.tone : undefined;
    const nudge = await draftAiNudge(alertId, tone);
    res.json(nudge);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/fulfillment-optimize", async (req, res, next) => {
  try {
    const quotationId =
      typeof req.body?.quotationId === "string" ? req.body.quotationId : "";
    const proposal = await getAiFulfillmentProposal(quotationId);
    res.json(proposal);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/billing-explain", async (req, res, next) => {
  try {
    const quotationId =
      typeof req.body?.quotationId === "string" ? req.body.quotationId : "";
    const explanation = await getAiBillingExplanation(quotationId);
    res.json(explanation);
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/draft-credit-note", async (req, res, next) => {
  try {
    const parsed = AiDraftCreditNoteRequestSchema.parse(req.body);
    const userId = req.user?.sub ?? "user";
    const draft = await draftAiCreditNote(parsed, userId);
    res.json(draft);
  } catch (err) {
    next(err);
  }
});
