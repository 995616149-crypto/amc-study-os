import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The reader is verified through Playwright against http://127.0.0.1, and Next dev blocks
  // its own dev resources (client chunks and HMR) for hosts it does not recognise. That
  // block is SILENT in the page: the server-rendered HTML appears, but hydration never
  // runs, so a client component sits on its loading branch with no network traffic and no
  // console error. Whitelisting the loopback hosts keeps `next dev` usable for the reader.
  allowedDevOrigins: ["127.0.0.1", "localhost", "[::1]"],
};

export default nextConfig;
