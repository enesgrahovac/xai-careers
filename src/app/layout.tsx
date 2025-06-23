import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "xAI Careers [concept]",
    description: "Use AI to find your best position at xAI",
};

export const viewport: Viewport = {
    themeColor: "#000000",
    initialScale: 1,
    width: "device-width",
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}
            >
                {/* Header */}
                <header className="w-full border-b border-black/10 dark:border-white/10 py-4 px-6">
                    <div className="flex justify-between items-end">
                        <h1 className="text-lg font-semibold leading-none">
                            xAI Careers <span className="opacity-60">[concept]</span>
                        </h1>
                        <a 
                            href="https://enesxgrahovac.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors leading-none"
                        >
                            Enes, 2025
                        </a>
                    </div>
                </header>

                {/* Page content */}
                {children}
                <Analytics />
            </body>
        </html>
    );
}
