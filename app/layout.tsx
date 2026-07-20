import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL("https://jabszstudio.com"),
  title: `${brand.studio} — ${brand.tagline}`,
  description: brand.metaDescription,
  keywords: [
    "Jabsz Studio", "Jabeer", "Multimedia Specialist", "Branding", "Videography",
    "Photography", "Web Development", "AI Content", "Sri Lanka", "Creative Portfolio",
  ],
  openGraph: {
    title: `${brand.studio} — Creative Portfolio`,
    description: brand.ogDescription,
    type: "website",
    siteName: brand.studio,
    images: ["/images/avatar.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.studio} — Creative Portfolio`,
    description: brand.ogDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#060606",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jabeer",
  jobTitle: "Multimedia Specialist",
  worksFor: { "@type": "Organization", name: "Jabsz Studio" },
  email: "hello@jabszstudio.com",
  telephone: "+94743514359",
  address: { "@type": "PostalAddress", addressCountry: "LK" },
  sameAs: [
    "https://www.instagram.com/jabsz_studio",
    "https://www.linkedin.com/",
  ],
  knowsAbout: [
    "Branding", "Videography", "Photography", "Web Development",
    "Digital Marketing", "AI Content Creation",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
