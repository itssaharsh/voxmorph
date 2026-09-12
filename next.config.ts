import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We hand-maintain CLAUDE.md with verified AssemblyAI API facts; the generator
  // appends its own section on every dev boot, so keep it off.
  agentRules: false,
};

export default nextConfig;
