import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // SSG pre-rendering: generates static HTML files for static routes at build time
  async prerender() {
    return ["/", "/auth/login"];
  },
} satisfies Config;
