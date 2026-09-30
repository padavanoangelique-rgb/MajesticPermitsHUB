import type { MetadataRoute } from "next";
import { allAreas } from "@/lib/public-areas";
import { PUBLIC_POSTS } from "@/lib/public-posts";

const SITE = "https://majesticpermits.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/areas", "/blog", "/faq", "/permit-closer", "/contact"].map((path) => ({
    url: `${SITE}${path || "/"}`,
    lastModified: now,
  }));

  const cities = allAreas().map((area) => ({
    url: `${SITE}/areas/${area.slug}`,
    lastModified: now,
  }));

  const posts = PUBLIC_POSTS.map((post) => ({
    url: `${SITE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticRoutes, ...cities, ...posts];
}
