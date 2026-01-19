import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wave - CEDA Collaborative Workspace",
  description: "AI-powered collaborative workspace for enterprise teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}
