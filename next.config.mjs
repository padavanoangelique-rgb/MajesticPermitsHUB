/** @type {import('next').NextConfig} */
const nextConfig = {
  // The county PDFs are read from disk when a form is filled, so they ship with that route.
  experimental: {
    outputFileTracingIncludes: { "/api/contractor/forms/pdf": ["./src/lib/forms/county-pdfs/**/*"] },
  },
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
