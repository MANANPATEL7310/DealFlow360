import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

// Route paths are kept in sync with `appRoutes` in @template/shared.
// appRoutes.home = "/", login = "/auth/login", dashboard = "/app", settings = "/app/settings"
export default [
  index("routes/home.tsx"),
  route("auth/login", "routes/login.tsx"),
  layout("routes/app-layout.tsx", [
    route("app", "routes/dashboard.tsx"),
    route("app/approvals", "routes/approvals.tsx"),
    route("app/settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
