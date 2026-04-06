import { GraphQLError } from 'graphql';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { Kysely } from 'kysely';
import type { Database, MatchCheckin, CheckinQrCode } from '@sporthub/db';
import { generateQrDataUrl } from '../../lib/qr.js';

const setLineupSchema = z.object({
  matchId: z.string().uuid(),
  teamId: z.string().uuid(),
  startingPlayerIds: z.array(z.string().uuid()).min(1),
});

const STARTING_COUNT: Record<string, number> = {
  football: 11,
  volleyball: 6,
  badminton: 1,
};

export class CheckinService {
  constructor(private db: Kysely<Database>) {}

  async openCheckin(
    matchId: string,
    userId: string,
    userRole: string
  ): Promise<{ matchId: string; checkins: MatchCheckin[]; qrCode: CheckinQrCode & { qrDataUrl: string }; isOpen: boolean }> {
    const match = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', matchId)
      .executeTakeFirst();

    if (!match) {
      throw new GraphQLError('Match not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(match.tournament_id, userId, userRole);

    // Update match status
    await this.db
      .updateTable('matches')
      .set({ status: 'checkin_open', updated_at: new Date() })
      .where('id', '=', matchId)
      .execute();

    // Get players for both teams
    const teamIds = [match.home_team_id, match.away_team_id].filter(Boolean) as string[];
    if (teamIds.length === 0) {
      throw new GraphQLError('Match teams not assigned yet', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const players = await this.db
      .selectFrom('team_players')
      .selectAll()
      .where('team_id', 'in', teamIds)
      .where('is_active', '=', true)
      .execute();

    // Delete existing checkins for this match and re-create
    await this.db.deleteFrom('match_checkins').where('match_id', '=', matchId).execute();

    if (players.length > 0) {
      await this.db
        .insertInto('match_checkins')
        .values(
          players.map((p) => ({
            match_id: matchId,
            team_id: p.team_id,
            player_id: p.id,
            status: 'pending' as const,
          }))
        )
        .execute();
    }

    // Generate QR code
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.deleteFrom('checkin_qr_codes').where('match_id', '=', matchId).execute();

    const qrRecord = await this.db
      .insertInto('checkin_qr_codes')
      .values({ match_id: matchId, code, expires_at: expiresAt })
      .returningAll()
      .executeTakeFirstOrThrow();

    const qrDataUrl = await generateQrDataUrl(code);

    const checkins = await this.db
      .selectFrom('match_checkins')
      .selectAll()
      .where('match_id', '=', matchId)
      .execute();

    return {
      matchId,
      checkins,
      qrCode: { ...qrRecord, qrDataUrl },
      isOpen: true,
    };
  }

  async playerCheckin(
    matchId: string,
    playerId: string,
    userId: string,
    userRole: string
  ): Promise<MatchCheckin> {
    const match = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', matchId)
      .executeTakeFirst();

    if (!match) {
      throw new GraphQLError('Match not found', { extensions: { code: 'NOT_FOUND' } });
    }

    if (match.status !== 'checkin_open') {
      throw new GraphQLError('Check-in is not open for this match', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const checkin = await this.db
      .selectFrom('match_checkins')
      .selectAll()
      .where('match_id', '=', matchId)
      .where('player_id', '=', playerId)
      .executeTakeFirst();

    if (!checkin) {
      throw new GraphQLError('Player not found in match checkin list', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (checkin.status === 'checked_in') {
      throw new GraphQLError('Player already checked in', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return this.db
      .updateTable('match_checkins')
      .set({
        status: 'checked_in',
        checked_in_at: new Date(),
        method: 'manual',
        checked_in_by: userId,
      })
      .where('id', '=', checkin.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async qrCheckin(code: string, playerId: string): Promise<MatchCheckin> {
    const qr = await this.db
      .selectFrom('checkin_qr_codes')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    if (!qr) {
      throw new GraphQLError('Invalid QR code', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    if (qr.is_used) {
      throw new GraphQLError('QR code already used', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    if (new Date() > qr.expires_at) {
      throw new GraphQLError('QR code expired', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const match = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', qr.match_id)
      .executeTakeFirst();

    if (!match || match.status !== 'checkin_open') {
      throw new GraphQLError('Check-in is not open for this match', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const checkin = await this.db
      .selectFrom('match_checkins')
      .selectAll()
      .where('match_id', '=', qr.match_id)
      .where('player_id', '=', playerId)
      .executeTakeFirst();

    if (!checkin) {
      throw new GraphQLError('Player not found in match checkin list', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (checkin.status === 'checked_in') {
      throw new GraphQLError('Player already checked in', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return this.db
      .updateTable('match_checkins')
      .set({
        status: 'checked_in',
        checked_in_at: new Date(),
        method: 'qr',
      })
      .where('id', '=', checkin.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async closeCheckin(
    matchId: string,
    userId: string,
    userRole: string
  ): Promise<{ matchId: string; checkins: MatchCheckin[]; qrCode: null; isOpen: boolean }> {
    const match = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', matchId)
      .executeTakeFirst();

    if (!match) {
      throw new GraphQLError('Match not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(match.tournament_id, userId, userRole);

    // Mark all pending as absent
    await this.db
      .updateTable('match_checkins')
      .set({ status: 'absent' })
      .where('match_id', '=', matchId)
      .where('status', '=', 'pending')
      .execute();

    // Invalidate QR codes
    await this.db
      .updateTable('checkin_qr_codes')
      .set({ is_used: true })
      .where('match_id', '=', matchId)
      .execute();

    // Update match status back to scheduled (or live)
    await this.db
      .updateTable('matches')
      .set({ status: 'scheduled', updated_at: new Date() })
      .where('id', '=', matchId)
      .execute();

    const checkins = await this.db
      .selectFrom('match_checkins')
      .selectAll()
      .where('match_id', '=', matchId)
      .execute();

    return { matchId, checkins, qrCode: null, isOpen: false };
  }

  async setLineup(
    input: unknown,
    userId: string,
    userRole: string
  ): Promise<MatchCheckin[]> {
    const data = setLineupSchema.parse(input);

    const match = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', data.matchId)
      .executeTakeFirst();

    if (!match) {
      throw new GraphQLError('Match not found', { extensions: { code: 'NOT_FOUND' } });
    }

    await this.verifyOrganizerAccess(match.tournament_id, userId, userRole);

    // Get sport type for starting count validation
    const tournament = await this.db
      .selectFrom('tournaments')
      .select('sport')
      .where('id', '=', match.tournament_id)
      .executeTakeFirstOrThrow();

    const expectedStarting = STARTING_COUNT[tournament.sport] ?? 11;
    if (data.startingPlayerIds.length !== expectedStarting) {
      throw new GraphQLError(
        `${tournament.sport} requires exactly ${expectedStarting} starting players, got ${data.startingPlayerIds.length}`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    // Reset all is_starting for this team in this match
    await this.db
      .updateTable('match_checkins')
      .set({ is_starting: false })
      .where('match_id', '=', data.matchId)
      .where('team_id', '=', data.teamId)
      .execute();

    // Set starting players
    if (data.startingPlayerIds.length > 0) {
      await this.db
        .updateTable('match_checkins')
        .set({ is_starting: true })
        .where('match_id', '=', data.matchId)
        .where('team_id', '=', data.teamId)
        .where('player_id', 'in', data.startingPlayerIds)
        .where('status', '=', 'checked_in')
        .execute();
    }

    return this.db
      .selectFrom('match_checkins')
      .selectAll()
      .where('match_id', '=', data.matchId)
      .where('team_id', '=', data.teamId)
      .execute();
  }

  async getCheckinStatus(
    matchId: string
  ): Promise<{ matchId: string; checkins: MatchCheckin[]; qrCode: (CheckinQrCode & { qrDataUrl: string }) | null; isOpen: boolean }> {
    const match = await this.db
      .selectFrom('matches')
      .selectAll()
      .where('id', '=', matchId)
      .executeTakeFirst();

    if (!match) {
      throw new GraphQLError('Match not found', { extensions: { code: 'NOT_FOUND' } });
    }

    const checkins = await this.db
      .selectFrom('match_checkins')
      .selectAll()
      .where('match_id', '=', matchId)
      .execute();

    const qrRecord = await this.db
      .selectFrom('checkin_qr_codes')
      .selectAll()
      .where('match_id', '=', matchId)
      .where('is_used', '=', false)
      .executeTakeFirst();

    let qrCode: (CheckinQrCode & { qrDataUrl: string }) | null = null;
    if (qrRecord) {
      const qrDataUrl = await generateQrDataUrl(qrRecord.code);
      qrCode = { ...qrRecord, qrDataUrl };
    }

    return {
      matchId,
      checkins,
      qrCode,
      isOpen: match.status === 'checkin_open',
    };
  }

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

    if (!tournament || (tournament.organizer_id !== userId && userRole !== 'admin' && userRole !== 'referee')) {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }
  }
}
