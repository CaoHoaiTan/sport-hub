import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ApolloWrapper } from "@/lib/apollo/provider";
import { AuthProvider } from "@/lib/auth/context";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SportHub",
  description: "Nền tảng quản lý giải đấu thể thao",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/icon-512.png',
  },
  openGraph: {
    title: 'SportHub',
    description: 'Nền tảng quản lý giải đấu thể thao',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <ApolloWrapper>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
