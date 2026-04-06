'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowRight, Users, Calendar } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(ROUTES.dashboard);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">SportHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href={ROUTES.login}>Log in</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.register}>Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Tournament management made simple
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Organize sports tournaments{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                with ease
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Create and manage football, volleyball, and badminton tournaments.
              Handle scheduling, live scoring, team registration, and payments
              all in one place.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href={ROUTES.register}>
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={ROUTES.publicTournaments}>
                  Browse tournaments
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="space-y-3 rounded-xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Multiple Formats</h3>
                <p className="text-sm text-muted-foreground">
                  Round-robin, single elimination, double elimination, and
                  group + knockout stages.
                </p>
              </div>
              <div className="space-y-3 rounded-xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Auto Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic bracket generation and round-robin scheduling with
                  venue assignment.
                </p>
              </div>
              <div className="space-y-3 rounded-xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Roster management, QR check-in, and role-based access for
                  organizers, managers, and referees.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} SportHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
