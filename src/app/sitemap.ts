import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/location", "/proprietaires", "/service-particulier", "/achat-vente", "/a-propos", "/faq", "/contact", "/conditions", "/confidentialite"];
  const vehicles = await db.vehicle.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, forRent: true, forSale: true, saleStatus: true, updatedAt: true } });
  return [
    ...pages.map((p) => ({ url: appUrl(p || "/") })),
    ...vehicles.filter((v) => v.forRent).map((v) => ({ url: appUrl(`/location/${v.slug}`), lastModified: v.updatedAt })),
    ...vehicles.filter((v) => v.forSale && v.saleStatus !== "SOLD").map((v) => ({ url: appUrl(`/achat-vente/${v.slug}`), lastModified: v.updatedAt })),
  ];
}
