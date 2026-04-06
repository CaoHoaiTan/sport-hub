import { cn } from '@/lib/utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PlayerStat {
  id: string;
  playerId: string;
  player: {
    id: string;
    fullName: string;
    jerseyNumber?: number | null;
    position?: string | null;
  };
  teamId: string;
  team: {
    id: string;
    name: string;
  };
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  pointsScored: number;
  aces: number;
  matchesPlayed: number;
  mvpCount: number;
}

interface PlayerStatsTableProps {
  statistics: PlayerStat[];
  sport: string;
  className?: string;
}

export function PlayerStatsTable({
  statistics,
  sport,
  className,
}: PlayerStatsTableProps) {
  if (statistics.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No player statistics available.
      </p>
    );
  }

  const isFootball = sport === 'football';
  const isVolleyball = sport === 'volleyball';

  const sorted = [...statistics].sort((a, b) => {
    if (isFootball) return b.goals - a.goals;
    return b.pointsScored - a.pointsScored;
  });

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            {isFootball && (
              <>
                <TableHead className="text-center w-12">G</TableHead>
                <TableHead className="text-center w-12">A</TableHead>
                <TableHead className="text-center w-12">YC</TableHead>
                <TableHead className="text-center w-12">RC</TableHead>
              </>
            )}
            {isVolleyball && (
              <>
                <TableHead className="text-center w-12">Pts</TableHead>
                <TableHead className="text-center w-12">Aces</TableHead>
              </>
            )}
            {!isFootball && !isVolleyball && (
              <TableHead className="text-center w-12">Pts</TableHead>
            )}
            <TableHead className="text-center w-10">MP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((stat, idx) => (
            <TableRow key={stat.id}>
              <TableCell className="text-center tabular-nums text-muted-foreground">
                {idx + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {stat.player.jerseyNumber != null && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      #{stat.player.jerseyNumber}
                    </span>
                  )}
                  <span className="text-sm font-medium">
                    {stat.player.fullName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {stat.team.name}
              </TableCell>
              {isFootball && (
                <>
                  <TableCell className="text-center font-semibold tabular-nums">
                    {stat.goals}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {stat.assists}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-yellow-600">
                    {stat.yellowCards}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-red-600">
                    {stat.redCards}
                  </TableCell>
                </>
              )}
              {isVolleyball && (
                <>
                  <TableCell className="text-center font-semibold tabular-nums">
                    {stat.pointsScored}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {stat.aces}
                  </TableCell>
                </>
              )}
              {!isFootball && !isVolleyball && (
                <TableCell className="text-center font-semibold tabular-nums">
                  {stat.pointsScored}
                </TableCell>
              )}
              <TableCell className="text-center tabular-nums">
                {stat.matchesPlayed}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
