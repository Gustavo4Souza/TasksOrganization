/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tasksorg/core"],
  // "standalone" gera um server.js autocontido em .next/standalone,
  // com só os node_modules realmente usados — é o que a imagem Docker
  // de produção (apps/web/Dockerfile) copia pro estágio final.
  output: "standalone",
};

export default nextConfig;
