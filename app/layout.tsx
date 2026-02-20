import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAN UNO",
  description: "LAN UNO is a multiplayer UNO game that can be played on a local network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
