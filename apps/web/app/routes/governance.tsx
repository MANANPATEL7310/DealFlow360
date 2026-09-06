import { GovernancePage } from "@/features/governance/pages/governance-page";

export function meta() {
  return [
    { title: "Discount Governance · DealFlow360" },
    {
      name: "description",
      content:
        "Administer customer tier discount ceilings, product category margin caps, and multi-tier approval escalation rules.",
    },
  ];
}

export default function GovernanceRoute() {
  return <GovernancePage />;
}
