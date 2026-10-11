const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "reinomatrizes.httwxxm.space" },
      { protocol: "https", hostname: "reinomatrizes1.httwxxm.space" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    unoptimized: true,
  },
}
module.exports = nextConfig
