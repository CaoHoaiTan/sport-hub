import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';

type MatchStatus =
  | 'scheduled'
  | 'checkin_open'
  | 'live'
  | 'completed'
  | 'postponed'
  | 'cancelled';

interface MatchStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  MatchStatus,
  { label: string; variant: 'secondary' | 'warning' | 'destructive' | 'success' | 'outline'; pulse?: boolean }
> = {
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  checkin_open: { label: 'Check-in Open', variant: 'warning' },
  live: { label: 'Live', variant: 'destructive', pulse: true },
  completed: { label: 'Completed', variant: 'success' },
  postponed: { label: 'Postponed', variant: 'outline' },
  cancelled: { label: 'Hủyled', variant: 'destructive' },
};

export function MatchStatusBadge({ status, className }: MatchStatusBadgeProps) {
  const config = statusConfig[status as MatchStatus] ?? {
    label: status,
    variant: 'secondary' as const,
  };

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {config.label}
    </Badge>
  );
}
