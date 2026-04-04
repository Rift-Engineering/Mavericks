import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const helpSerif = Lora({
  subsets: ["latin"],
  variable: "--font-help-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tokyo Mavericks",
  description: "Team attendance and carpool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${helpSerif.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <Nav />
          <main id="main-content" className="mx-auto w-full max-w-lg flex-1 px-4 pb-8 pt-4 md:max-w-4xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
