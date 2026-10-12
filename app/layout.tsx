import type { Metadata } from "next";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { OfflineBanner } from "@/components/site/offline-banner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
// Inter (OFL, app/fonts/Inter-OFL.txt) is self-hosted to override its vertical metrics.
// Stock metrics (ascent 0.97, descent 0.24) center the em box on capitals, so mostly-lowercase
// labels sit about 1px low next to centered icons. These values center it between cap and x-height.
// Font loader options must be literals, so both files repeat the same three declarations.
const sans = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  declarations: [
    { prop: "ascent-override", value: "92.4%" },
    { prop: "descent-override", value: "28.7%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});
const sansExt = localFont({
  src: "./fonts/inter-latin-ext.woff2",
  weight: "100 900",
  variable: "--font-inter-ext",
  preload: false,
  declarations: [
    { prop: "ascent-override", value: "92.4%" },
    { prop: "descent-override", value: "28.7%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});
// Mono only sets identifiers on item pages; not worth a preload everywhere.
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: { default: "Internet Archive (redesign concept)", template: "%s | Internet Archive (redesign concept)" },
  description:
    "An unofficial redesign concept for archive.org: search books, film, audio, software, images and archived web pages.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${sansExt.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <TooltipProvider delay={300}>
          <a
            href="#main"
            className="fixed top-2 left-2 z-50 flex h-11 -translate-y-20 items-center rounded-md bg-primary px-4 type-label text-on-primary focus:translate-y-0"
          >
            Skip to content
          </a>
          <Header />
          <OfflineBanner />
          <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </div>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
