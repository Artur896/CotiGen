import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/generate-pdf': ['./node_modules/@sparticuz/chromium/**/*'],
    '/api/materiales/pdf': ['./node_modules/@sparticuz/chromium/**/*'],
  },
};

export default nextConfig;
