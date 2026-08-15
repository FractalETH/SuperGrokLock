/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pino-pretty", "encoding", "pino"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@x402/evm/upto/client": false,
      "@x402/evm": false,
      "pino-pretty": false,
      encoding: false,
    };
    config.externals = [...(config.externals || []), "pino-pretty", "encoding", "pino"];
    return config;
  },
};

module.exports = nextConfig;