/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers(){return [{source:"/:path*",headers:[{key:"Content-Security-Policy",value:"frame-ancestors 'self' https://mpcommonwealth.site https://the-commonwealth-command.padavano-angelique.chatgpt.site https://admin.majesticpermits.com"}]}];},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
