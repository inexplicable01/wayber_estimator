import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wayber Home Estimate",
  description:
    "Snap a few photos of your home and get an instant, AI-powered comparative market estimate from Wayber.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#29493c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-dvh overflow-hidden antialiased`}
    >
      <body className="h-dvh overflow-hidden">
        <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col bg-wayber-lime/40 sm:my-6 sm:h-[calc(100dvh-3rem)] sm:rounded-3xl sm:shadow-2xl sm:overflow-hidden">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
