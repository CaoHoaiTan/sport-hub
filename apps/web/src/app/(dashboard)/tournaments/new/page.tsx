'use client';

import { TournamentForm } from '@/components/tournament/tournament-form';

export default function CreateTournamentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tạo giải đấu
        </h1>
        <p className="text-muted-foreground">
          Thiết lập giải đấu mới qua vài bước đơn giản.
        </p>
      </div>

      <TournamentForm />
    </div>
  );
}
