import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chromosome",
  description: "Interactive 3D visual experiments and components",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
