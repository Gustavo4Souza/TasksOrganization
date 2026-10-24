/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tasksorg/core"],
  // "standalone" gera um server.js autocontido em .next/standalone, com só os
  // node_modules usados — é o que a imagem Docker (apps/web/Dockerfile) copia.
  // Só é ligado no build do Docker (NEXT_OUTPUT=standalone): no Windows, com o
  // pnpm, o standalone tem links para o node_modules real e o próximo build, ao
  // apagar o .next, esvaziava esses pacotes (next, busboy, caniuse-lite...).
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default nextConfig;
