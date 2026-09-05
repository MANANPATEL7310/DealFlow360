import {
  getOpenAlerts,
  getQuotationTimeline,
} from "../../deal-health/deal-health.service.js";

export async function buildTriageTaskPrompt() {
  const alerts = await getOpenAlerts();
  const timelines = await Promise.all(
    alerts.map((alert) => getQuotationTimeline(alert.quotationId)),
  );

  return JSON.stringify({
    alerts: alerts.map((alert) => ({
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      detail: alert.detail,
      quotationId: alert.quotationId,
      quotationStatus: alert.quotation.status,
      salesRepId: alert.quotation.salesRepId,
      dealValueMinor: alert.quotation.grandTotalMinor,
    })),
    timelines,
  });
}
