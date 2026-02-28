import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true, // Console mein poora URL dikhayega
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', 
  },
};

export default nextConfig;
