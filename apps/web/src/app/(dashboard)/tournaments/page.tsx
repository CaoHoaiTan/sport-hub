'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { GET_MY_TOURNAMENTS } from '@/graphql/queries/tournament';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { TournamentFilter } from '@/components/tournament/tournament-filter';

interface TournamentFilters {
  sport?: string;
  status?: string;
  search?: string;
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const { data, loading } = useQuery(GET_MY_TOURNAMENTS);
  const [filters, setFilters] = useState<TournamentFilters>({});

  const handleFilterChange = useCallback((newFilters: TournamentFilters) => {
    setFilters(newFilters);
  }, []);

  const tournaments = useMemo(() => {
    const all = data?.myTournaments ?? [];
    return all.filter((t: TournamentData) => {
      if (filters.sport && t.sport !== filters.sport) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (
        filters.search &&
        !t.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [data, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground">
            Manage and track your tournaments.
          </p>
        </div>
        {user && isOrganizer(user.role) && (
          <Button asChild>
            <Link href={ROUTES.tournamentNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Link>
          </Button>
        )}
      </div>

      <TournamentFilter onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-xl" />
              <div className="space-y-2 px-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament: TournamentData) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground mb-4">No tournaments found.</p>
          {user && isOrganizer(user.role) && (
            <Button asChild variant="outline">
              <Link href={ROUTES.tournamentNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first tournament
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface TournamentData {
  id: string;
  name: string;
  slug?: string;
  sport: string;
  format: string;
  status: string;
  startDate?: string;
  endDate?: string;
  maxTeams?: number;
  entryFee?: number;
  currency?: string;
  bannerUrl?: string;
  organizer?: { fullName: string };
}
