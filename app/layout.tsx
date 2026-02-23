import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FieldFlow | Service Management",
  description: "Management software for plumbers, electricians, and assessors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* You can add a global Toaster component here for notifications later */}
        {children}
      </body>
    </html>
  );
}