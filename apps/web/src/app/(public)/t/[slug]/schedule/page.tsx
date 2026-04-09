import { type Metadata } from 'next';
import { CalendarDays } from 'lucide-react';

import { getClient } from '@/lib/apollo/rsc-client';
import { GET_PUBLIC_SCHEDULE, GET_PUBLIC_TOURNAMENT } from '@/graphql/queries/public';
import { MatchSchedule } from '@/components/match/match-schedule';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = getClient();

  try {
    const { data } = await client.query({
      query: GET_PUBLIC_TOURNAMENT,
      variables: { slug },
    });

    const tournament = data?.publicTournament;
    return {
      title: tournament ? `Schedule - ${tournament.name}` : 'Schedule',
      description: tournament
        ? `Match schedule for ${tournament.name}`
        : 'Tournament match schedule',
    };
  } catch {
    return {
      title: 'Schedule',
      description: 'Tournament match schedule',
    };
  }
}

export default async function PublicSchedulePage({ params }: PageProps) {
  const { slug } = await params;
  const client = getClient();

  let tournament = null;
  let matches: Array<{
    id: string;
    tournamentId: string;
    round?: number | null;
    roundName?: string | null;
    groupName?: string | null;
    bracketPosition?: number | null;
    scheduledAt?: string | null;
    status: string;
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeam?: { id: string; name: string; logoUrl?: string | null } | null;
    awayTeam?: { id: string; name: string; logoUrl?: string | null } | null;
    venue?: { id: string; name: string } | null;
    sets?: { id: string; setNumber: number; homeScore: number; awayScore: number }[] | null;
  }> = [];

  try {
    const [tournamentRes, scheduleRes] = await Promise.all([
      client.query({
        query: GET_PUBLIC_TOURNAMENT,
        variables: { slug },
      }),
      client.query({
        query: GET_PUBLIC_SCHEDULE,
        variables: { tournamentSlug: slug },
      }),
    ]);

    tournament = tournamentRes.data?.publicTournament;
    matches = scheduleRes.data?.publicSchedule ?? [];
  } catch {
    // Render empty state below
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Không tìm thấy giải đấu.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Lịch thi đấu</h1>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Chưa có trận đấu nào được lên lịch.
          </p>
        </div>
      ) : (
        <MatchSchedule
          matches={matches}
          tournamentId={tournament.id}
          readOnly
        />
      )}
    </div>
  );
}
