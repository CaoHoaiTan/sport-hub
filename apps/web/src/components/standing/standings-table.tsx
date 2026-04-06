import { cn } from '@/lib/utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StandingTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface Standing {
  id: string;
  teamId: string;
  team: StandingTeam;
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
}

interface StandingsTableProps {
  standings: Standing[];
  sport: string;
  highlightTopN?: number;
  className?: string;
}

export function StandingsTable({
  standings,
  sport,
  highlightTopN = 0,
  className,
}: StandingsTableProps) {
  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
  const isSetSport = sport === 'volleyball' || sport === 'badminton';

  if (sorted.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No standings data available.
      </p>
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center w-10">P</TableHead>
            <TableHead className="text-center w-10">W</TableHead>
            <TableHead className="text-center w-10">D</TableHead>
            <TableHead className="text-center w-10">L</TableHead>
            <TableHead className="text-center w-12">GF</TableHead>
            <TableHead className="text-center w-12">GA</TableHead>
            <TableHead className="text-center w-12">GD</TableHead>
            {isSetSport && (
              <>
                <TableHead className="text-center w-12">SW</TableHead>
                <TableHead className="text-center w-12">SL</TableHead>
              </>
            )}
            <TableHead className="text-center w-12 font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((standing) => {
            const isHighlighted =
              highlightTopN > 0 && standing.rank <= highlightTopN;

            return (
              <TableRow
                key={standing.id}
                className={cn(
                  isHighlighted && 'bg-green-500/5 border-l-2 border-l-green-500'
                )}
              >
                <TableCell className="text-center font-medium tabular-nums">
                  {standing.rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                      {standing.team.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {standing.team.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {standing.played}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {standing.won}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {standing.drawn}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {standing.lost}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {standing.goalsFor}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {standing.goalsAgainst}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-center tabular-nums',
                    standing.goalDifference > 0 && 'text-green-600',
                    standing.goalDifference < 0 && 'text-red-600'
                  )}
                >
                  {standing.goalDifference > 0 ? '+' : ''}
                  {standing.goalDifference}
                </TableCell>
                {isSetSport && (
                  <>
                    <TableCell className="text-center tabular-nums">
                      {standing.setsWon ?? 0}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {standing.setsLost ?? 0}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-center font-bold tabular-nums">
                  {standing.points}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
