import { MobileNav } from "@/components/layouts/mobile-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "nexo",
  description: "Tu agenda personal y de convivencia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="flex justify-between items-center px-6 h-16 border-b sticky top-0 bg-background z-50">
              <div className="flex items-center gap-2">
                <SignedIn>
                  <MobileNav />
                </SignedIn>
                <Link href="/" className="text-xl font-bold tracking-tighter">
                  nexo
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </header>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
