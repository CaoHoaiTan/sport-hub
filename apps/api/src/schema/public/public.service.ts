import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { Kysely } from 'kysely';
import type {
  Database,
  Tournament,
  Match,
  Standing,
  TournamentPost,
  MatchComment,
} from '@sporthub/db';

const createPostSchema = z.object({
  tournamentId: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  mediaUrls: z.array(z.string().url()).nullable().optional(),
  isPinned: z.boolean().default(false),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  mediaUrls: z.array(z.string().url()).nullable().optional(),
  isPinned: z.boolean().optional(),
});

const addCommentSchema = z.object({
  matchId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  guestName: z.string().min(1).max(100).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export class PublicService {
  constructor(private db: Kysely<Database>) {}

  // ─── Public Read-Only Queries ──────────────────────────

  async getPublicTournament(slug: string): Promise<Tournament | undefined> {
    return this.db
      .selectFrom('tournaments')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst();
  }

  async getPublicMatch(id: string): Promise<Match | undefined> {
    return this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async getPublicStandings(tournamentSlug: string): Promise<Standing[]> {
    const tournament = await this.db
      .selectFrom('tournaments')
      .select(['id'])
      .where('slug', '=', tournamentSlug)
      .executeTakeFirst();

    if (!tournament) return [];

    return this.db
      .selectFrom('standings')
      .selectAll()
      .where('tournament_id', '=', tournament.id)
      .orderBy('rank', 'asc')
      .execute();
  }

  async getPublicSchedule(tournamentSlug: string): Promise<Match[]> {
    const tournament = await this.db
      .selectFrom('tournaments')
      .select(['id'])
      .where('slug', '=', tournamentSlug)
      .executeTakeFirst();

    if (!tournament) return [];

    return this.db
      .selectFrom('matches')
      .selectAll()
      .where('tournament_id', '=', tournament.id)
      .orderBy('scheduled_at', 'asc')
      .orderBy('round', 'asc')
      .execute();
  }

  // ─── Tournament Posts ──────────────────────────────────

  async getTournamentPosts(
    tournamentId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<TournamentPost[]> {
    return this.db
      .selectFrom('tournament_posts')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('is_pinned', 'desc')
      .orderBy('created_at', 'desc')
      .limit(Math.min(limit, 50))
      .offset(offset)
      .execute();
  }

  async createPost(input: unknown, userId: string, userRole: string): Promise<TournamentPost> {
    const data = createPostSchema.parse(input);
    await this.verifyOrganizerAccess(data.tournamentId, userId, userRole);

    return this.db
      .insertInto('tournament_posts')
      .values({
        tournament_id: data.tournamentId,
        author_id: userId,
        title: data.title,
        content: data.content,
        media_urls: data.mediaUrls ?? null,
        is_pinned: data.isPinned,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updatePost(
    id: string,
    input: unknown,
    userId: string,
    userRole: string
  ): Promise<TournamentPost> {
    const data = updatePostSchema.parse(input);

    const post = await this.db
      .selectFrom('tournament_posts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!post) {
      throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(post.tournament_id, userId, userRole);

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mediaUrls !== undefined) updateData.media_urls = data.mediaUrls;
    if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;

    return this.db
      .updateTable('tournament_posts')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deletePost(id: string, userId: string, userRole: string): Promise<boolean> {
    const post = await this.db
      .selectFrom('tournament_posts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!post) {
      throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(post.tournament_id, userId, userRole);

    await this.db.deleteFrom('tournament_posts').where('id', '=', id).execute();
    return true;
  }

  // ─── Match Comments ────────────────────────────────────

  async getMatchComments(
    matchId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MatchComment[]> {
    return this.db
      .selectFrom('match_comments')
      .selectAll()
      .where('match_id', '=', matchId)
      .where('parent_id', 'is', null)
      .orderBy('created_at', 'desc')
      .limit(Math.min(limit, 100))
      .offset(offset)
      .execute();
  }

  async addComment(input: unknown, userId: string | null): Promise<MatchComment> {
    const data = addCommentSchema.parse(input);

    if (!userId && !data.guestName) {
      throw new GraphQLError('Guest name required for unauthenticated comments', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (data.parentId) {
      const parent = await this.db
        .selectFrom('match_comments')
        .select(['id', 'match_id'])
        .where('id', '=', data.parentId)
        .executeTakeFirst();

      if (!parent || parent.match_id !== data.matchId) {
        throw new GraphQLError('Parent comment not found in this match', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    return this.db
      .insertInto('match_comments')
      .values({
        match_id: data.matchId,
        user_id: userId,
        guest_name: userId ? null : data.guestName ?? null,
        content: data.content,
        parent_id: data.parentId ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteComment(id: string, userId: string, userRole: string): Promise<boolean> {
    const comment = await this.db
      .selectFrom('match_comments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!comment) {
      throw new GraphQLError('Comment not found', { extensions: { code: 'NOT_FOUND' } });
    }

    // Allow comment owner or admin to delete
    if (comment.user_id !== userId && userRole !== 'admin') {
      // Check if user is tournament organizer
      const match = await this.db
        .selectFrom('matches')
        .innerJoin('tournaments', 'tournaments.id', 'matches.tournament_id')
        .select(['tournaments.organizer_id'])
        .where('matches.id', '=', comment.match_id)
        .executeTakeFirst();

      if (!match || match.organizer_id !== userId) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
      }
    }

    await this.db.deleteFrom('match_comments').where('id', '=', id).execute();
    return true;
  }

  // ─── Match Reactions ───────────────────────────────────

  async addReaction(matchId: string, userId: string, reaction: string): Promise<boolean> {
    // Toggle: if exists, remove; if not, add
    const existing = await this.db
      .selectFrom('match_reactions')
      .select(['id'])
      .where('match_id', '=', matchId)
      .where('user_id', '=', userId)
      .where('reaction', '=', reaction)
      .executeTakeFirst();

    if (existing) {
      await this.db.deleteFrom('match_reactions').where('id', '=', existing.id).execute();
    } else {
      await this.db
        .insertInto('match_reactions')
        .values({ match_id: matchId, user_id: userId, reaction })
        .execute();
    }

    return true;
  }

  async getReactionCounts(matchId: string): Promise<Array<{ reaction: string; count: number }>> {
    const results = await this.db
      .selectFrom('match_reactions')
      .select(['reaction'])
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('match_id', '=', matchId)
      .groupBy('reaction')
      .execute();

    return results.map((r) => ({ reaction: r.reaction, count: Number(r.count) }));
  }

  // ─── Helpers ───────────────────────────────────────────

  private async verifyOrganizerAccess(
    tournamentId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const tournament = await this.db
      .selectFrom('tournaments')
      .select(['organizer_id'])
      .where('id', '=', tournamentId)
      .executeTakeFirst();

    if (!tournament || (tournament.organizer_id !== userId && userRole !== 'admin')) {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }
  }
}
