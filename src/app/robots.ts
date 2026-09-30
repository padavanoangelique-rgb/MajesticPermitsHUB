import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/login", "/api", "/track"],
    },
    sitemap: "https://www.majesticpermits.com/sitemap.xml",
  };
}
