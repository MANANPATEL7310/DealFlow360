import { forwardRef } from "react";
import { Link, NavLink } from "react-router";
import type { LinkProps, NavLinkProps } from "react-router";

export const PrefetchLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ prefetch = "intent", ...props }, ref) => {
    return <Link ref={ref} prefetch={prefetch} {...props} />;
  },
);

PrefetchLink.displayName = "PrefetchLink";

export const PrefetchNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ prefetch = "intent", ...props }, ref) => {
    return <NavLink ref={ref} prefetch={prefetch} {...props} />;
  },
);

PrefetchNavLink.displayName = "PrefetchNavLink";
