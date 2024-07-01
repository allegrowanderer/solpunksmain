import { config } from 'dotenv';
config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_PRIVATE_KEY: process.env.PRIVATE_KEY,
  },
};

export default nextConfig;
