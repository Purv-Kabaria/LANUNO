import type { Metadata } from "next";
import { Cabin } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAN UNO",
  description: "LAN UNO is a multiplayer UNO game that can be played on a local network.",
};

export const cabin = Cabin({
  subsets: ["latin"],
  variable: "--font-cabin",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cabin.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
