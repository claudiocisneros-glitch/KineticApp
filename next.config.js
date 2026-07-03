/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nota: para PWA completa (service worker, offline) sumar next-pwa
  // una vez que el piloto esté validado y se decida publicar como instalable.
};

module.exports = nextConfig;
