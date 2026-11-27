import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / heavy server-only packages: load them from node_modules at runtime
  // instead of bundling (onnxruntime-node ships .node binaries).
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "pg"],
};

export default nextConfig;
