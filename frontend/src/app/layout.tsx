import type { Metadata } from "next";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Air Board Hierarchy",
  description: "Board hierarchy manager built for the Air fullstack challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
