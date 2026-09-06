import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/theme/theme-provider";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import "@/style.css";

export const meta: MetaFunction = () => {
  return [
    { title: "DealFlow360 · Quote-to-cash for B2B sales teams" },
    {
      name: "description",
      content: "Quote-to-cash for B2B sales teams, without the bottlenecks.",
    },
  ];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

// Runs before first paint to apply the persisted theme and avoid a flash of
// the wrong color scheme during hydration. Keep the storage key in sync with
// storageKeys.themeMode ("app.theme-mode").
const themeInitScript = `(function(){try{var m=localStorage.getItem("app.theme-mode");var d=m==="dark"||((m==="system"||!m)&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Outlet />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
