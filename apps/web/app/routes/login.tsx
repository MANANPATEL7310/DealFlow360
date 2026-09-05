import type { MetaFunction } from "react-router";
import { LoginPage } from "@/features/auth/pages/login-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign in | Template" },
    {
      name: "description",
      content: "Sign in to access your dashboard.",
    },
  ];
};

export default function LoginRoute() {
  return <LoginPage />;
}
