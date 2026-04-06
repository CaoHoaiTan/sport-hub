'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/lib/constants';
import { GET_TEAM } from '@/graphql/queries/team';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RosterManager } from '@/components/player/roster-manager';

export default function TeamPlayersPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, loading } = useQuery(GET_TEAM, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.teamDetail(id)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {team.name} - Players
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the team roster.
          </p>
        </div>
      </div>

      <RosterManager
        teamId={id}
        minPlayers={5}
        maxPlayers={25}
      />
    </div>
  );
}
