import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { appUrl } from "@/lib/mail";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "AUTO225.COM — Location et vente de véhicules à Abidjan", template: "%s | AUTO225.COM" },
  description:
    "Louez un véhicule avec ou sans chauffeur, mettez votre voiture en location, demandez un service sur mesure ou trouvez un véhicule à acheter à Abidjan.",
  icons: { icon: "/brand/icon-64.png", apple: "/brand/icon-192.png" },
  openGraph: { type: "website", locale: "fr_CI", siteName: "AUTO225.COM", images: ["/brand/og-image.jpg"] },
};

export const viewport: Viewport = { themeColor: "#145c3c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
