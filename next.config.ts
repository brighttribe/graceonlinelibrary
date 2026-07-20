import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's automatic trailing-slash redirect 308s PostHog's ingest endpoint
  // (/ingest/i/v0/e/), and posthog-js does not follow it, so events are lost.
  // Disable the automatic redirect, then restore it below for real pages only.
  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      // Re-apply trailing-slash normalisation for pages, but never for /ingest.
      // `.+` (not `.*`) so "/" itself cannot match and cause a redirect loop.
      { source: "/:path((?!ingest).+)/", destination: "/:path", permanent: true },
    ];
  },

  // PostHog reverse proxy: routes analytics through our own domain so ad blockers
  // do not drop it. Must stay in sync with api_host:'/ingest' in app/layout.tsx.
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
      { source: "/ingest/decide", destination: "https://us.i.posthog.com/decide" },
    ];
  },
};

export default nextConfig;
