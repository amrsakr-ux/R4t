import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for Docker/Render; Netlify uses its own Next.js runtime
  ...(process.env.NETLIFY ? {} : { output: "standalone" }),
  serverExternalPackages: ["@prisma/client", "pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
