import type { MetadataRoute } from "next";

const siteUrl = "https://jukwaakenya.co.ke";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/pricing", "/support", "/legal", "/polls/"],
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/signup/",
          "/reset-password",
          "/forgot-password",
          "/payment/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
