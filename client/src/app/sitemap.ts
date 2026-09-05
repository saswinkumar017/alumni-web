import type { MetadataRoute } from "next";

const BASE_URL = "https://alumni.jjcinet.ac.in";

const publicRoutes = ["", "/about", "/contact", "/faq", "/directory", "/events"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}
