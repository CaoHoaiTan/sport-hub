'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { GET_TOURNAMENT_POSTS } from '@/graphql/queries/public';
import { CREATE_POST, UPDATE_POST, DELETE_POST } from '@/graphql/mutations/public';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { PostCard } from '@/components/public/post-card';

interface Post {
  id: string;
  title: string;
  content: string;
  isGhim: boolean;
  createdAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string | null } | null;
}

export default function PostsPage() {
  const params = useParams();
  const { user } = useAuth();
  const tournamentId = params.id as string;
  const canManage = user && isOrganizer(user.role);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGhim, setIsGhim] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TOURNAMENT_POSTS, {
    variables: { tournamentId, limit: 50, offset: 0 },
    skip: !tournamentId,
  });

  const [createPost, { loading: creating }] = useMutation(CREATE_POST, {
    onCompleted: () => {
      toast.success('Post created.');
      closeForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [updatePost, { loading: updating }] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      toast.success('Post updated.');
      closeForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deletePost, { loading: deleting }] = useMutation(DELETE_POST, {
    onCompleted: () => {
      toast.success('Post deleted.');
      setDeleteId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const posts: Post[] = data?.tournamentPosts ?? [];
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isGhim !== b.isGhim) return a.isGhim ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function openCreate() {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setIsGhim(false);
    setFormOpen(true);
  }

  function openEdit(post: Post) {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setIsGhim(post.isGhim);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPost(null);
    setTitle('');
    setContent('');
    setIsGhim(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingPost) {
      await updatePost({
        variables: {
          id: editingPost.id,
          input: { title, content, isGhim },
        },
      });
    } else {
      await createPost({
        variables: {
          input: { tournamentId, title, content, isGhim },
        },
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Posts</h2>
          <p className="text-sm text-muted-foreground">
            Thông báo và cập nhật giải đấu.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        )}
      </div>

      {sortedPosts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts yet"
          description="Tournament posts and announcements will appear here."
        />
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={canManage ? openEdit : undefined}
              onDelete={canManage ? (id) => setDeleteId(id) : undefined}
            />
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Edit Post' : 'Create Post'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-content">Content</Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Pin Post</p>
                <p className="text-xs text-muted-foreground">
                  Ghim posts appear at the top
                </p>
              </div>
              <Switch checked={isGhim} onCheckedChange={setIsGhim} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" disabled={creating || updating}>
                {(creating || updating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingPost ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleting}
        onConfirm={() => {
          if (deleteId) {
            deletePost({ variables: { id: deleteId } });
          }
        }}
      />
    </div>
  );
}
