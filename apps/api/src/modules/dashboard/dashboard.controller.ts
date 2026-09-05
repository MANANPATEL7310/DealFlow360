import type { Request, Response } from "express";
import { sendOk } from "../../lib/response.js";

export function dashboardSummaryController(req: Request, res: Response) {
  const firstName = req.user?.name?.split(" ")[0] ?? "Builder";

  return sendOk(res, {
    title: `${firstName}'s workspace snapshot`,
    updatedAt: new Date().toISOString(),
    metrics: [
      {
        id: "projects",
        label: "Active streams",
        value: "08",
        trend: "Two new workstreams this week",
        tone: "primary",
      },
      {
        id: "efficiency",
        label: "Team efficiency",
        value: "91%",
        trend: "Execution quality is trending upward",
        tone: "secondary",
      },
      {
        id: "health",
        label: "System health",
        value: "99.9%",
        trend: "Operational baseline is stable",
        tone: "success",
      },
      {
        id: "attention",
        label: "Risks flagged",
        value: "03",
        trend: "Three issues need prioritization",
        tone: "warning",
      },
    ],
  });
}
