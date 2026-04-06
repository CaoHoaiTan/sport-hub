import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';

type TournamentStatus =
  | 'draft'
  | 'registration'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface TournamentStatusBadgeProps {
  status: TournamentStatus;
  className?: string;
}

const statusConfig: Record<
  TournamentStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  registration: { label: 'Registration', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'success' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export function TournamentStatusBadge({
  status,
  className,
}: TournamentStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: 'secondary' as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
