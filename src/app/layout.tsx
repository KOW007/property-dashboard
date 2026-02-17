import type { Metadata } from "next";
import { Dosis } from "next/font/google";
import "./globals.css";

const dosis = Dosis({
  subsets: ["latin"],
  variable: "--font-dosis",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Spearhead Properties | Austin Rentals Since 2001",
  description: "Providing Austin with beautiful rentals since 2001. Find your next home with Spearhead Properties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dosis.variable} font-sans antialiased`} style={{ fontFamily: "'Dosis', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
