import { MessageSquare } from 'lucide-react';

import { getClient } from '@/lib/apollo/rsc-client';
import { GET_PUBLIC_TOURNAMENT, GET_TOURNAMENT_POSTS } from '@/graphql/queries/public';
import { PostCard } from '@/components/public/post-card';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicPostsPage({ params }: Props) {
  const { slug } = await params;

  let tournamentId: string | null = null;
  try {
    const { data } = await getClient().query({
      query: GET_PUBLIC_TOURNAMENT,
      variables: { slug },
    });
    tournamentId = data?.publicTournament?.id ?? null;
  } catch {
    // handled below
  }

  if (!tournamentId) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Tournament not found.
      </div>
    );
  }

  let posts: Array<{
    id: string;
    title: string;
    content: string;
    isGhim: boolean;
    createdAt: string;
    author?: { id: string; fullName: string; avatarUrl?: string | null } | null;
  }> = [];

  try {
    const { data } = await getClient().query({
      query: GET_TOURNAMENT_POSTS,
      variables: { tournamentId, limit: 50, offset: 0 },
    });
    posts = data?.tournamentPosts ?? [];
  } catch {
    // posts stays empty
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isGhim !== b.isGhim) return a.isGhim ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (sortedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Chưa có bài viết</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Các thông báo và cập nhật giải đấu sẽ xuất hiện ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Posts</h2>
      {sortedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
