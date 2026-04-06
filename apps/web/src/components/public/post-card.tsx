import { Pin, Pencil, Trash2 } from 'lucide-react';

import { formatRelativeTime } from '@/lib/utils/format';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const truncatedContent =
    post.content.length > 200
      ? `${post.content.slice(0, 200)}...`
      : post.content;

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={post.author?.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {post.author?.fullName?.slice(0, 2).toUpperCase() ?? '??'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{post.title}</h3>
              {post.isPinned && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  <Pin className="mr-1 h-2.5 w-2.5" />
                  Pinned
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.author?.fullName ?? 'Unknown'} &middot;{' '}
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(post)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {truncatedContent}
        </p>
      </CardContent>
    </Card>
  );
}
