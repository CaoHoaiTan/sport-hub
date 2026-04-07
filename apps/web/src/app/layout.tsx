import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ApolloWrapper } from '@/lib/apollo/provider';
import { AuthProvider } from '@/lib/auth/context';
import { Toaster } from '@/components/ui/toaster';

import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SportHub',
  description: 'Nền tảng quản lý giải đấu thể thao',
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
