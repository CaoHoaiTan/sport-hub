'use client';

import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';
import { GET_MATCH_REACTION_COUNTS } from '@/graphql/queries/public';
import { ADD_REACTION } from '@/graphql/mutations/public';
import { Button } from '@/components/ui/button';

interface ReactionBarProps {
  matchId: string;
}

const reactions = [
  { key: 'like', emoji: '\uD83D\uDC4D', label: 'Like' },
  { key: 'cheer', emoji: '\uD83C\uDF89', label: 'Cheer' },
  { key: 'fire', emoji: '\uD83D\uDD25', label: 'Fire' },
  { key: 'clap', emoji: '\uD83D\uDC4F', label: 'Clap' },
];

export function ReactionBar({ matchId }: ReactionBarProps) {
  const { user } = useAuth();

  const { data, refetch } = useQuery(GET_MATCH_REACTION_COUNTS, {
    variables: { matchId },
    skip: !matchId,
  });

  const [addReaction] = useMutation(ADD_REACTION, {
    onCompleted: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const counts: Array<{ reaction: string; count: number }> =
    data?.matchReactionCounts ?? [];

  function getCount(reaction: string): number {
    return counts.find((c) => c.reaction === reaction)?.count ?? 0;
  }

  function handleReact(reaction: string) {
    if (!user) {
      toast.error('Please log in to react.');
      return;
    }
    addReaction({ variables: { matchId, reaction } });
  }

  return (
    <div className="flex items-center gap-2">
      {reactions.map((r) => {
        const count = getCount(r.key);
        return (
          <Button
            key={r.key}
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 text-xs',
              count > 0 && 'border-primary/30'
            )}
            onClick={() => handleReact(r.key)}
            title={r.label}
          >
            <span>{r.emoji}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
