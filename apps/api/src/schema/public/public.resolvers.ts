import type { TournamentPost, MatchComment } from '@sporthub/db';
import type { GraphQLContext } from '../../context.js';
import { requireAuth, requireRole } from '../../middleware/role.guard.js';
import { PublicService } from './public.service.js';

export const publicResolvers = {
  Query: {
    publicTournament: async (
      _: unknown,
      { slug }: { slug: string },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getPublicTournament(slug) ?? null;
    },

    publicMatch: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getPublicMatch(id) ?? null;
    },

    publicStandings: async (
      _: unknown,
      { tournamentSlug }: { tournamentSlug: string },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getPublicStandings(tournamentSlug);
    },

    publicSchedule: async (
      _: unknown,
      { tournamentSlug }: { tournamentSlug: string },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getPublicSchedule(tournamentSlug);
    },

    tournamentPosts: async (
      _: unknown,
      { tournamentId, limit, offset }: { tournamentId: string; limit?: number; offset?: number },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getTournamentPosts(tournamentId, limit ?? 20, offset ?? 0);
    },

    matchComments: async (
      _: unknown,
      { matchId, limit, offset }: { matchId: string; limit?: number; offset?: number },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getMatchComments(matchId, limit ?? 50, offset ?? 0);
    },

    matchReactionCounts: async (
      _: unknown,
      { matchId }: { matchId: string },
      ctx: GraphQLContext
    ) => {
      const service = new PublicService(ctx.db);
      return service.getReactionCounts(matchId);
    },
  },

  Mutation: {
    createPost: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PublicService(ctx.db);
      return service.createPost(input, user.id, user.role);
    },

    updatePost: async (
      _: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PublicService(ctx.db);
      return service.updatePost(id, input, user.id, user.role);
    },

    deletePost: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireRole(ctx.user, 'organizer', 'admin');
      const service = new PublicService(ctx.db);
      return service.deletePost(id, user.id, user.role);
    },

    addComment: async (
      _: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext
    ) => {
      // Comments can be from authenticated or guest users
      const service = new PublicService(ctx.db);
      return service.addComment(input, ctx.user?.id ?? null);
    },

    deleteComment: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PublicService(ctx.db);
      return service.deleteComment(id, user.id, user.role);
    },

    addReaction: async (
      _: unknown,
      { matchId, reaction }: { matchId: string; reaction: string },
      ctx: GraphQLContext
    ) => {
      const user = requireAuth(ctx.user);
      const service = new PublicService(ctx.db);
      return service.addReaction(matchId, user.id, reaction);
    },
  },

  TournamentPost: {
    tournamentId: (p: TournamentPost) => p.tournament_id,
    authorId: (p: TournamentPost) => p.author_id,
    author: async (p: TournamentPost, _: unknown, ctx: GraphQLContext) => {
      return ctx.db.selectFrom('users').selectAll().where('id', '=', p.author_id).executeTakeFirst();
    },
    mediaUrls: (p: TournamentPost) => p.media_urls,
    isPinned: (p: TournamentPost) => p.is_pinned,
    createdAt: (p: TournamentPost) => p.created_at,
    updatedAt: (p: TournamentPost) => p.updated_at,
  },

  MatchComment: {
    matchId: (c: MatchComment) => c.match_id,
    userId: (c: MatchComment) => c.user_id,
    user: async (c: MatchComment, _: unknown, ctx: GraphQLContext) => {
      if (!c.user_id) return null;
      return ctx.db.selectFrom('users').selectAll().where('id', '=', c.user_id).executeTakeFirst();
    },
    guestName: (c: MatchComment) => c.guest_name,
    parentId: (c: MatchComment) => c.parent_id,
    replies: async (c: MatchComment, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .selectFrom('match_comments')
        .selectAll()
        .where('parent_id', '=', c.id)
        .orderBy('created_at', 'asc')
        .execute();
    },
    createdAt: (c: MatchComment) => c.created_at,
  },
};
