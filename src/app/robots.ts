import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/mail";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/api/", "/connexion", "/inscription", "/suivi", "/admin-securite"] },
    sitemap: appUrl("/sitemap.xml"),
  };
}
