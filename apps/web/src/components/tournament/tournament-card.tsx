import Link from 'next/link';
import { Calendar, Users, Trophy } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { formatDate, formatVND } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TournamentStatusBadge } from './tournament-status-badge';

interface TournamentCardProps {
  tournament: {
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
  };
  className?: string;
}

const sportIcons: Record<string, string> = {
  football: 'F',
  volleyball: 'V',
  badminton: 'B',
};

const sportColors: Record<string, string> = {
  football: 'bg-green-500/10 text-green-700 border-green-200',
  volleyball: 'bg-orange-500/10 text-orange-700 border-orange-200',
  badminton: 'bg-blue-500/10 text-blue-700 border-blue-200',
};

const formatLabels: Record<string, string> = {
  round_robin: 'Round Robin',
  single_elimination: 'Single Elim',
  double_elimination: 'Double Elim',
  group_stage_knockout: 'Group + KO',
};

export function TournamentCard({ tournament, className }: TournamentCardProps) {
  return (
    <Link href={ROUTES.tournamentDetail(tournament.id)}>
      <Card
        className={cn(
          'group overflow-hidden transition-all hover:shadow-md hover:border-primary/20',
          className
        )}
      >
        <div className="relative h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          {tournament.bannerUrl ? (
            <img
              src={tournament.bannerUrl}
              alt={tournament.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Trophy className="h-10 w-10 text-primary/20" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm bg-background/80',
                sportColors[tournament.sport]
              )}
            >
              {tournament.sport}
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            <TournamentStatusBadge
              status={tournament.status as 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'}
            />
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {tournament.name}
            </h3>
            {tournament.organizer && (
              <p className="text-xs text-muted-foreground mt-0.5">
                by {tournament.organizer.fullName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">
              {formatLabels[tournament.format] ?? tournament.format}
            </Badge>
            {tournament.maxTeams && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tournament.maxTeams} teams
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {tournament.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(tournament.startDate)}
              </span>
            )}
            {tournament.entryFee != null && tournament.entryFee > 0 && (
              <span className="font-medium text-foreground">
                {formatVND(tournament.entryFee)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
