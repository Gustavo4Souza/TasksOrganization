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
  // Em produção (Vercel) o site repassa /api/* para o projeto da API. Para o
  // navegador fica tudo no mesmo domínio, então o cookie de sessão é de primeira
  // parte. Use NEXT_PUBLIC_API_URL=/api junto com API_ORIGIN=<endereço da API>.
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN?.trim().replace(/\/$/, "");
    return apiOrigin ? [{ source: "/api/:path*", destination: `${apiOrigin}/:path*` }] : [];
  },
};

export default nextConfig;
