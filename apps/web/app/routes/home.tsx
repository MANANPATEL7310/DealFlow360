import type { MetaFunction } from "react-router";
import { HomePage } from "@/features/marketing/pages/home-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Home | Template" },
    {
      name: "description",
      content: "Fast, modern full-stack web application template.",
    },
  ];
};

export default function HomeRoute() {
  return <HomePage />;
}
