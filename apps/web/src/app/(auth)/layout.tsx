import Link from 'next/link';
import Image from 'next/image';

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
        <Image src="/logo-horizontal.svg" alt="SportHub" width={180} height={40} priority />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
