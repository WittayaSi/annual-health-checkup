import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '172.168.0.252',
    '172.168.0.*',
    '172.168.*',
    '192.168.*',
    '10.*',
    'pregnant-armchair-old.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
    'localhost:3000',
    'localhost:5555',
  ],
};


export default nextConfig;
