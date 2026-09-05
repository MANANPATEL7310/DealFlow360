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
      customerName: alert.customerName,
      salesRepName: alert.salesRepName,
      dealValueMinor: alert.metrics?.atRiskAmountMinor ?? 0,
    })),
    timelines,
  });
}
