import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Voxmorph — Speak Once, Send Everywhere",
  description:
    "Dictate once and get the same message written for your boss, your team, your users, your engineers and your family. Powered by the AssemblyAI Dictation API.",
  applicationName: "Voxmorph",
  openGraph: {
    title: "Voxmorph — Speak Once, Send Everywhere",
    description: "One utterance, five audiences. Built on the AssemblyAI Dictation API.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  // The mic button is press-and-hold; letting the page zoom on double-tap makes it
  // feel broken on mobile.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh bg-slate-950 font-sans text-slate-100 antialiased">{children}</body>
    </html>
  );
}
