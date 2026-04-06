'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Wand2 } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { GET_MATCHES_BY_TOURNAMENT } from '@/graphql/queries/match';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import { GENERATE_MATCHES } from '@/graphql/mutations/match';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MatchSchedule } from '@/components/match/match-schedule';
import { BracketView } from '@/components/match/bracket-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ELIMINATION_FORMATS = ['single_elimination', 'double_elimination'];
const GROUP_KNOCKOUT_FORMAT = 'group_stage_knockout';

export default function TournamentSchedulePage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tournamentData } = useQuery(GET_TOURNAMENT, {
    variables: { id: tournamentId },
    skip: !tournamentId,
  });

  const { data, loading } = useQuery(GET_MATCHES_BY_TOURNAMENT, {
    variables: { tournamentId },
    skip: !tournamentId,
  });

  const [generateMatches, { loading: generating }] = useMutation(
    GENERATE_MATCHES,
    {
      variables: { tournamentId },
      refetchQueries: [
        { query: GET_MATCHES_BY_TOURNAMENT, variables: { tournamentId } },
      ],
    }
  );

  const tournament = tournamentData?.tournament;
  const matches = data?.matchesByTournament ?? [];
  const canManage = user && isOrganizer(user.role);

  const format = tournament?.format ?? '';
  const isElimination = ELIMINATION_FORMATS.includes(format);
  const isGroupKnockout = format === GROUP_KNOCKOUT_FORMAT;

  async function handleGenerate() {
    try {
      await generateMatches();
      toast.success('Matches generated successfully.');
      setDialogOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate matches';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasMatches = matches.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Match Schedule</h2>
        </div>

        {canManage && !hasMatches && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Matches
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Matches</DialogTitle>
                <DialogDescription>
                  This will automatically generate the match schedule based on
                  the tournament format and registered teams. Existing matches
                  will not be affected.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!hasMatches ? (
        <div className="text-center py-16 space-y-2">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No matches have been scheduled yet.
          </p>
          {canManage && (
            <p className="text-sm text-muted-foreground">
              Use the &quot;Generate Matches&quot; button to create the schedule.
            </p>
          )}
        </div>
      ) : isElimination ? (
        <BracketView
          matches={matches}
          tournamentId={tournamentId}
          variant={format === 'double_elimination' ? 'double' : 'single'}
        />
      ) : isGroupKnockout ? (
        <GroupKnockoutView
          matches={matches}
          tournamentId={tournamentId}
          format={format}
        />
      ) : (
        <MatchSchedule matches={matches} tournamentId={tournamentId} />
      )}
    </div>
  );
}

function GroupKnockoutView({
  matches,
  tournamentId,
}: {
  matches: Array<{
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
    winnerTeamId?: string | null;
  }>;
  tournamentId: string;
  format: string;
}) {
  const groupMatches = matches.filter((m) => m.groupName != null);
  const knockoutMatches = matches.filter((m) => m.groupName == null);

  return (
    <Tabs defaultValue="groups" className="space-y-4">
      <TabsList>
        <TabsTrigger value="groups">Group Stage</TabsTrigger>
        <TabsTrigger value="knockout">Knockout</TabsTrigger>
      </TabsList>
      <TabsContent value="groups">
        <MatchSchedule matches={groupMatches} tournamentId={tournamentId} />
      </TabsContent>
      <TabsContent value="knockout">
        {knockoutMatches.length > 0 ? (
          <BracketView
            matches={knockoutMatches}
            tournamentId={tournamentId}
            variant="single"
          />
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Knockout stage matches have not been generated yet.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
