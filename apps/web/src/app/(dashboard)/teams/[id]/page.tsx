'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import {
  Users,
  Shield,
  Trophy,
  Hash,
} from 'lucide-react';

import { ROUTES } from '@/lib/constants';
import { GET_TEAM } from '@/graphql/queries/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TEAM, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const team = data?.team;
  if (!team) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Team not found.
      </div>
    );
  }

  const players = team.players ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={team.logoUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {team.manager && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {team.manager.fullName}
                </span>
              )}
              {team.groupName && (
                <Badge variant="outline" className="text-[10px]">
                  Group {team.groupName}
                </Badge>
              )}
              {team.seed && (
                <span className="flex items-center gap-1 text-xs">
                  <Hash className="h-3 w-3" />
                  Seed {team.seed}
                </span>
              )}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={ROUTES.teamPlayers(id)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Players
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Roster ({players.length} players)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No players registered yet.
            </p>
          ) : (
            <div className="space-y-2">
              {players.map(
                (player: {
                  id: string;
                  fullName: string;
                  jerseyNumber: number | null;
                  position: string | null;
                  isCaptain: boolean;
                  isActive: boolean;
                }) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      {player.jerseyNumber != null && (
                        <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-right">
                          #{player.jerseyNumber}
                        </span>
                      )}
                      <span className="text-sm font-medium">
                        {player.fullName}
                      </span>
                      {player.isCaptain && (
                        <Badge variant="secondary" className="text-[10px]">
                          Captain
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {player.position && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {player.position}
                        </span>
                      )}
                      <Badge
                        variant={player.isActive ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {player.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
