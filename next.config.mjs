/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pg has dynamic requires — keep it out of the client/server bundle.
  serverExternalPackages: ['pg'],
};

export default nextConfig;
