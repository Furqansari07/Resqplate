import type { Metadata } from "next";
import { Quicksand, Nunito } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/Providers";

const heading = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ResQPlate - Surplus Food Redistribution",
  description: "Connecting surplus food donors with shelters via volunteers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}