import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Navbar } from "~/components/Navbar";
import { TooltipProvider } from "~/components/ui/tooltip";

export const metadata: Metadata = {
  title: "SocialPosts - Share Your Thoughts",
  description: "A modern social platform to share and discover amazing content",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950/20">
        <TRPCReactProvider cookies={cookieString}>
          <TooltipProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </TooltipProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
