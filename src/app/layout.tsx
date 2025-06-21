import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
            >
                {/* Header */}
                <header className="w-full border-b border-black/10 dark:border-white/10 py-3 px-6">
                    <h1 className="text-lg font-semibold">
                        xAI Careers <span className="opacity-60">[concept]</span>
                    </h1>
                </header>

                {/* Page content */}
                {children}
            </body>
        </html>
    );
}
