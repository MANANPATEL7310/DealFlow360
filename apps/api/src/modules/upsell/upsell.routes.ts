// apps/api/src/modules/upsell/upsell.routes.ts
// === M6: Upsell routes — mounted on /quotations base path ===
//
// GET  /quotations/:id/upsell              — ranked suggestions
// POST /quotations/:id/upsell/:suggestedId — accept suggestion, add to quote

import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { sendOk } from "../../lib/response.js";
import { getUpsellSuggestions, addUpsell } from "./upsell.service.js";

export const upsellRouter = createRouter();
upsellRouter.use(requireAuth);

// Get ranked upsell suggestions for a quotation
upsellRouter.get("/:id/upsell", async (req, res) =>
  sendOk(res, await getUpsellSuggestions(req.params.id as string)),
);

// Accept a suggestion — adds a line to the quotation
upsellRouter.post("/:id/upsell/:suggestedId", async (req, res) =>
  sendOk(
    res,
    await addUpsell(
      req.params.id as string,
      req.params.suggestedId as string,
      req.user as { id: string; role: string },
    ),
    "Suggestion added.",
  ),
);
