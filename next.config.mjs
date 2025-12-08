/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
  // Disable any potential Dune integrations
  experimental: {
    optimizePackageImports: ["@relayprotocol/relay-kit-ui"],
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /test/,
        contextRegExp: /thread-stream/,
      })
    );
    return config;
  },
};

export default nextConfig;
