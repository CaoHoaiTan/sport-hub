'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { formatRelativeTime } from '@/lib/utils/format';
import { GET_MATCH_COMMENTS } from '@/graphql/queries/public';
import { ADD_COMMENT } from '@/graphql/mutations/public';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  id: string;
  userId: string | null;
  user: { id: string; fullName: string; avatarUrl?: string | null } | null;
  guestName: string | null;
  content: string;
  parentId: string | null;
  createdAt: string;
  replies?: Comment[];
}

interface CommentThreadProps {
  matchId: string;
}

export function CommentThread({ matchId }: CommentThreadProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_MATCH_COMMENTS, {
    variables: { matchId, limit: 50, offset: 0 },
    skip: !matchId,
  });

  const [addComment, { loading: submitting }] = useMutation(ADD_COMMENT, {
    onCompleted: () => {
      setContent('');
      setReplyTo(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const comments: Comment[] = data?.matchComments ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    await addComment({
      variables: {
        input: {
          matchId,
          content: content.trim(),
          guestName: user ? null : guestName.trim() || 'Anonymous',
          parentId: replyTo,
        },
      },
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyTo(id)}
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Replying to comment</span>
            <button
              type="button"
              className="text-destructive hover:underline"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}
        {!user && (
          <Input
            placeholder="Your name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button
            type="submit"
            size="sm"
            className="self-end"
            disabled={submitting || !content.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (id: string) => void;
}) {
  const displayName = comment.user?.fullName ?? comment.guestName ?? 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={comment.user?.avatarUrl ?? undefined} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {comment.content}
          </p>
          <button
            type="button"
            className="text-xs text-primary hover:underline mt-1"
            onClick={() => onReply(comment.id)}
          >
            Reply
          </button>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 space-y-3 border-l-2 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
