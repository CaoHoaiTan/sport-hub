import Link from 'next/link';
import { Trophy } from 'lucide-react';

import { ROUTES } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link
        href={ROUTES.home}
        className="mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <Trophy className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight">SportHub</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
