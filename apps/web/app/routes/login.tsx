import type { MetaFunction } from "react-router";
import { LoginPage } from "@/features/auth/pages/login-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign In · Access Workspace | DealFlow360" },
    {
      name: "description",
      content: "Sign in to access your DealFlow360 quotation operations.",
    },
  ];
};

export default function LoginRoute() {
  return <LoginPage />;
}
