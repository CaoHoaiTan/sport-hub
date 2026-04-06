import {
  Circle,
  Square,
  ArrowLeftRight,
  Target,
  AlertTriangle,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface MatchEvent {
  id: string;
  matchId: string;
  teamId?: string | null;
  playerId?: string | null;
  eventType: string;
  minute?: number | null;
  setNumber?: number | null;
  description?: string | null;
  createdAt: string;
}

interface MatchEventFeedProps {
  events: MatchEvent[];
  className?: string;
}

const eventConfig: Record<
  string,
  { icon: typeof Circle; color: string; label: string }
> = {
  goal: { icon: Circle, color: 'text-green-600', label: 'Goal' },
  assist: { icon: Zap, color: 'text-blue-500', label: 'Assist' },
  yellow_card: { icon: Square, color: 'text-yellow-500', label: 'Yellow Card' },
  red_card: { icon: Square, color: 'text-red-600', label: 'Red Card' },
  substitution: {
    icon: ArrowLeftRight,
    color: 'text-sky-500',
    label: 'Substitution',
  },
  penalty: { icon: Target, color: 'text-orange-500', label: 'Penalty' },
  own_goal: { icon: AlertTriangle, color: 'text-red-400', label: 'Own Goal' },
  point: { icon: Circle, color: 'text-green-500', label: 'Point' },
};

export function MatchEventFeed({ events, className }: MatchEventFeedProps) {
  if (events.length === 0) {
    return (
      <p className={cn('text-center text-sm text-muted-foreground py-6', className)}>
        No match events recorded yet.
      </p>
    );
  }

  const sortedEvents = [...events].sort((a, b) => {
    if (a.minute != null && b.minute != null) return a.minute - b.minute;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className={cn('space-y-0', className)}>
      {sortedEvents.map((event, idx) => {
        const config = eventConfig[event.eventType] ?? {
          icon: Circle,
          color: 'text-muted-foreground',
          label: event.eventType,
        };
        const Icon = config.icon;
        const isLast = idx === sortedEvents.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card',
                  config.color
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            <div className="pb-4 pt-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{config.label}</span>
                {event.minute != null && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {event.minute}&apos;
                  </span>
                )}
                {event.setNumber != null && (
                  <span className="text-xs text-muted-foreground">
                    Set {event.setNumber}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
