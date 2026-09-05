import { ProductsPage } from "@/features/products/pages/products-page";

export function meta() {
  return [
    { title: "Product & Price List Engine · DealFlow360" },
    {
      name: "description",
      content:
        "Manage enterprise product catalog, variants, and tiered customer price schedules.",
    },
  ];
}

export default function ProductsRoute() {
  return <ProductsPage />;
}
