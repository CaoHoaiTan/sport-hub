import Link from 'next/link';
import { Trophy, Calendar, Users } from 'lucide-react';

import { getClient } from '@/lib/apollo/rsc-client';
import { GET_TOURNAMENTS } from '@/graphql/queries/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const sportLabels: Record<string, string> = {
  football: 'Football',
  volleyball: 'Volleyball',
  badminton: 'Badminton',
};

const statusColors: Record<string, string> = {
  draft: 'secondary',
  registration: 'warning',
  in_progress: 'success',
  completed: 'default',
  cancelled: 'destructive',
};

export default async function PublicTournamentsPage() {
  let tournaments: Array<{
    id: string;
    name: string;
    slug: string;
    sport: string;
    status: string;
    startDate: string | null;
    maxTeams: number | null;
    bannerUrl: string | null;
    description: string | null;
  }> = [];

  try {
    const { data } = await getClient().query({
      query: GET_TOURNAMENTS,
      variables: { pagination: { first: 50 } },
    });
    tournaments =
      data?.tournaments?.edges?.map(
        (e: { node: Record<string, unknown> }) => e.node
      ) ?? [];
  } catch {
    // tournaments stays empty
  }

  const publicTournaments = tournaments.filter(
    (t) => t.status !== 'draft' && t.status !== 'cancelled'
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
        <p className="text-muted-foreground mt-1">
          Browse all public tournaments.
        </p>
      </div>

      {publicTournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No tournaments</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            There are no public tournaments at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicTournaments.map((tournament) => (
            <Link key={tournament.id} href={`/t/${tournament.slug}`}>
              <Card className="group transition-all hover:shadow-md hover:border-primary/20 h-full">
                {tournament.bannerUrl && (
                  <div className="h-32 overflow-hidden rounded-t-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tournament.bannerUrl}
                      alt={tournament.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm group-hover:text-primary transition-colors">
                    {tournament.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {sportLabels[tournament.sport] ?? tournament.sport}
                    </Badge>
                    <Badge
                      variant={
                        (statusColors[tournament.status] as 'default' | 'secondary' | 'destructive' | 'outline') ??
                        'secondary'
                      }
                      className="text-[10px] capitalize"
                    >
                      {tournament.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {tournament.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {tournament.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tournament.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {tournament.maxTeams && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tournament.maxTeams} teams max
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
