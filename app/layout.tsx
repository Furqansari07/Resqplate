import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Footer from '@/components/Footer';
import "./globals.css";
import { Providers } from "@/components/Providers";

const heading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
   <html lang="en" className={`${heading.variable} ${body.variable} dark`}>
  <body className="antialiased">
    <Providers>{children}</Providers>
    <Footer />
  </body>
</html> 
  );
}