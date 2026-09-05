import { Link } from "react-router";
import { appRoutes } from "@template/shared";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function NotFoundPage() {
  return (
    <main className="app-shell flex items-center justify-center">
      <Card className="max-w-xl space-y-4 text-center">
        <h1 className="text-8xl font-bold tracking-widest text-primary/10">
          404
        </h1>
        <h1 className="page-title">The page you requested does not exist.</h1>
        <p className="page-copy max-w-none">
          This template ships with public and protected routes already wired, so
          you can redirect users cleanly while you build new flows.
        </p>
        <Link className={cn(buttonVariants())} to={appRoutes.home}>
          Go back home
        </Link>
      </Card>
    </main>
  );
}
