'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, ThumbsUp } from 'lucide-react';

import { ROUTES } from '@/lib/constants';
import { GET_PUBLIC_MATCH, GET_MATCH_COMMENTS, GET_MATCH_REACTION_COUNTS } from '@/graphql/queries/public';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LiveScoreBoard } from '@/components/match/live-score-board';
import { MatchEventFeed } from '@/components/match/match-event-feed';

const POLL_INTERVAL_MS = 15_000;

export default function PublicMatchDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const matchId = params.matchId as string;

  const { data, loading, startPolling, stopPolling } = useQuery(
    GET_PUBLIC_MATCH,
    {
      variables: { id: matchId },
      skip: !matchId,
    }
  );

  const match = data?.publicMatch;
  const isLive = match?.status === 'live';

  useEffect(() => {
    if (isLive) {
      startPolling(POLL_INTERVAL_MS);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isLive, startPolling, stopPolling]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Không tìm thấy trận đấu.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.publicSchedule(slug)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại lịch thi đấu
          </Link>
        </Button>
      </div>

      <LiveScoreBoard match={match} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Match Events</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchEventFeed events={match.events ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <MatchReactions matchId={matchId} />
          <MatchComments matchId={matchId} />
        </div>
      </div>
    </div>
  );
}

function MatchReactions({ matchId }: { matchId: string }) {
  const { data } = useQuery(GET_MATCH_REACTION_COUNTS, {
    variables: { matchId },
    skip: !matchId,
  });

  const reactions = data?.matchReactionCounts ?? [];

  const reactionEmojis: Record<string, string> = {
    like: '👍',
    love: '❤️',
    fire: '🔥',
    clap: '👏',
    sad: '😢',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ThumbsUp className="h-4 w-4" />
          Cảm xúc
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có cảm xúc nào.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {reactions.map(
              (r: { reaction: string; count: number }) => (
                <Badge key={r.reaction} variant="secondary" className="gap-1 text-sm">
                  <span>{reactionEmojis[r.reaction] ?? r.reaction}</span>
                  <span className="tabular-nums">{r.count}</span>
                </Badge>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchComments({ matchId }: { matchId: string }) {
  const { data, loading } = useQuery(GET_MATCH_COMMENTS, {
    variables: { matchId, limit: 20, offset: 0 },
    skip: !matchId,
  });

  const comments = data?.matchComments ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Bình luận
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có bình luận. Hãy là người đầu tiên bình luận!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map(
              (comment: {
                id: string;
                user?: { id: string; fullName: string; avatarUrl?: string | null } | null;
                guestName?: string | null;
                content: string;
                createdAt: string;
                replies?: Array<{
                  id: string;
                  user?: { id: string; fullName: string; avatarUrl?: string | null } | null;
                  guestName?: string | null;
                  content: string;
                  createdAt: string;
                }> | null;
              }) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase text-muted-foreground shrink-0">
                      {(comment.user?.fullName ?? comment.guestName ?? '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">
                        {comment.user?.fullName ?? comment.guestName ?? 'Ẩn danh'}
                      </p>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-9 space-y-2 border-l-2 border-muted pl-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold uppercase text-muted-foreground shrink-0">
                            {(reply.user?.fullName ?? reply.guestName ?? '?').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">
                              {reply.user?.fullName ?? reply.guestName ?? 'Ẩn danh'}
                            </p>
                            <p className="text-xs text-foreground">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
