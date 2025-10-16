import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import { AppProvider } from "@/contexts/app-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fira = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Nextra CMS",
  description: "Full-fledged Next.js CMS inspired by Nextra Docs",
};

const NAV = [
  { label: "Home", href: "/" },
  {
    label: "Products",
    children: [
      { label: "Overview", href: "/products" },
      { label: "Pricing", href: "/pricing" },
      { label: "Docs", href: "/docs" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fira.variable} font-sans antialiased`}
      >
        <AppProvider>
          <SiteHeader
            nav={NAV as any}
            logo={{ src: "/next.svg", alt: "Tingily", width: 70, height: 70 }}
            cta={{ label: "Get Started", href: "/auth?action=register" }}
          />

          <main className="min-h-[calc(100dvh-56px-240px)]">{children}</main>
          <SiteFooter />
        </AppProvider>
      </body>
    </html>
  );
}
