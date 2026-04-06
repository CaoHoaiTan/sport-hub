'use client';

import { TournamentForm } from '@/components/tournament/tournament-form';

export default function CreateTournamentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Tournament
        </h1>
        <p className="text-muted-foreground">
          Set up a new tournament in a few steps.
        </p>
      </div>

      <TournamentForm />
    </div>
  );
}
