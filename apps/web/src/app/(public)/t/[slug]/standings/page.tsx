import { type Metadata } from 'next';
import { BarChart3 } from 'lucide-react';

import { getClient } from '@/lib/apollo/rsc-client';
import {
  GET_PUBLIC_TOURNAMENT,
  GET_PUBLIC_STANDINGS,
} from '@/graphql/queries/public';
import { StandingsTable } from '@/components/standing/standings-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      title: tournament ? `Standings - ${tournament.name}` : 'Standings',
      description: tournament
        ? `Tournament standings for ${tournament.name}`
        : 'Tournament standings',
    };
  } catch {
    return {
      title: 'Standings',
      description: 'Tournament standings',
    };
  }
}

export default async function PublicStandingsPage({ params }: PageProps) {
  const { slug } = await params;
  const client = getClient();

  let tournament = null;
  let standings: Array<{
    id: string;
    teamId: string;
    team: { id: string; name: string; logoUrl?: string | null };
    groupName?: string | null;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    setsWon?: number | null;
    setsLost?: number | null;
    rank: number;
  }> = [];

  try {
    const [tournamentRes, standingsRes] = await Promise.all([
      client.query({
        query: GET_PUBLIC_TOURNAMENT,
        variables: { slug },
      }),
      client.query({
        query: GET_PUBLIC_STANDINGS,
        variables: { tournamentSlug: slug },
      }),
    ]);

    tournament = tournamentRes.data?.publicTournament;
    standings = standingsRes.data?.publicStandings ?? [];
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

  const sport = tournament.sport ?? 'football';
  const teamsPerGroupAdvance = tournament.teamsPerGroupAdvance ?? 2;

  const groups = Array.from(
    new Set(
      standings
        .map((s) => s.groupName)
        .filter((g): g is string => g != null)
    )
  ).sort();

  const hasGroups = groups.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Standings</h1>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Chưa có dữ liệu bảng xếp hạng.
          </p>
        </div>
      ) : hasGroups ? (
        <StandingsWithGroups
          standings={standings}
          groups={groups}
          sport={sport}
          highlightTopN={teamsPerGroupAdvance}
        />
      ) : (
        <StandingsTable standings={standings} sport={sport} />
      )}
    </div>
  );
}

function StandingsWithGroups({
  standings,
  groups,
  sport,
  highlightTopN,
}: {
  standings: Array<{
    id: string;
    teamId: string;
    team: { id: string; name: string; logoUrl?: string | null };
    groupName?: string | null;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    setsWon?: number | null;
    setsLost?: number | null;
    rank: number;
  }>;
  groups: string[];
  sport: string;
  highlightTopN: number;
}) {
  return (
    <Tabs defaultValue={groups[0]} className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        {groups.map((group) => (
          <TabsTrigger key={group} value={group}>
            {group}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsContent key={group} value={group}>
          <StandingsTable
            standings={standings.filter((s) => s.groupName === group)}
            sport={sport}
            highlightTopN={highlightTopN}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
