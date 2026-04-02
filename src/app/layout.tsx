import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Distinct serif for Help — contrasts with Inter nav links */
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
        <div className="flex min-h-dvh flex-col">
          <Nav />
          <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-8 pt-4 md:max-w-4xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
