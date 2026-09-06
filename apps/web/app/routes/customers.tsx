import { CustomersPage } from "@/features/customers/pages/customers-page";

export function meta() {
  return [
    { title: "Customers · DealFlow360" },
    {
      name: "description",
      content:
        "Manage enterprise customer directory, partner tier assignments, and negotiation portal magic links.",
    },
  ];
}

export default function CustomersRoute() {
  return <CustomersPage />;
}
