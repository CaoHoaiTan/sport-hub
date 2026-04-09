'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function PublicNavbar() {
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <Image src="/logo-horizontal.svg" alt="SportHub" width={140} height={32} priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={ROUTES.publicTournaments}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Giải đấu
          </Link>
          {!isLoading && (
            <>
              {user ? (
                <Link href={ROUTES.dashboard}>
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={ROUTES.login}>Đăng nhập</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={ROUTES.register}>Đăng ký</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </nav>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Mở menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Image src="/icon.svg" alt="SportHub" width={20} height={20} />
                SportHub
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4">
              <Link
                href={ROUTES.publicTournaments}
                className="text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Giải đấu
              </Link>
              {!isLoading && (
                <>
                  {user ? (
                    <Link
                      href={ROUTES.dashboard}
                      className="text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Tổng quan
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2 pt-4">
                      <Button variant="outline" asChild>
                        <Link
                          href={ROUTES.login}
                          onClick={() => setMobileOpen(false)}
                        >
                          Đăng nhập
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link
                          href={ROUTES.register}
                          onClick={() => setMobileOpen(false)}
                        >
                          Đăng ký
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
