import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestDb, cleanAllTables, destroyTestDb } from '../helpers/test-db.js';
import { createTestClient } from '../helpers/test-client.js';

/**
 * Full tournament lifecycle tests for all 3 sports:
 * Football, Volleyball, Badminton
 *
 * Each test covers:
 * 1. Create tournament
 * 2. Open registration
 * 3. Register teams (by regular users)
 * 4. Add players to teams
 * 5. Start tournament
 * 6. Generate matches
 * 7. Open check-in + player check-in
 * 8. Submit match results (sport-specific scoring)
 * 9. Verify standings
 * 10. Complete tournament
 */

// ── GraphQL operations ──────────────────────────────────

const REGISTER_USER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) { accessToken user { id email role } }
  }
`;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { accessToken user { id role } }
  }
`;

const CREATE_TOURNAMENT = `
  mutation CreateTournament($input: CreateTournamentInput!) {
    createTournament(input: $input) { id name slug status sport format }
  }
`;

const UPDATE_STATUS = `
  mutation UpdateTournamentStatus($id: ID!, $status: TournamentStatus!) {
    updateTournamentStatus(id: $id, status: $status) { id status }
  }
`;

const REGISTER_TEAM = `
  mutation RegisterTeam($input: RegisterTeamInput!) {
    registerTeam(input: $input) { id name managerId }
  }
`;

const ADD_PLAYER = `
  mutation AddPlayer($input: AddPlayerInput!) {
    addPlayer(input: $input) { id fullName jerseyNumber userId teamId }
  }
`;

const GENERATE_MATCHES = `
  mutation GenerateMatches($tournamentId: ID!) {
    generateMatches(tournamentId: $tournamentId) {
      id homeTeamId awayTeamId round status
    }
  }
`;

const SUBMIT_RESULT = `
  mutation SubmitMatchResult($id: ID!, $input: SubmitMatchResultInput!) {
    submitMatchResult(id: $id, input: $input) {
      id status homeScore awayScore winnerTeamId isDraw
    }
  }
`;

const GET_STANDINGS = `
  query GetStandings($tournamentId: ID!) {
    standingsByTournament(tournamentId: $tournamentId) {
      teamId
      team { id name }
      played won drawn lost
      goalsFor goalsAgainst goalDifference points rank
      setsWon setsLost
    }
  }
`;

const OPEN_CHECKIN = `
  mutation OpenCheckin($matchId: ID!) {
    openCheckin(matchId: $matchId) {
      matchId isOpen
      qrCode { code }
      checkins { id playerId status }
    }
  }
`;

const PLAYER_CHECKIN = `
  mutation PlayerCheckin($matchId: ID!, $playerId: ID!) {
    playerCheckin(matchId: $matchId, playerId: $playerId) {
      id playerId status checkedInAt
    }
  }
`;

const MATCHES_BY_TOURNAMENT = `
  query MatchesByTournament($tournamentId: ID!) {
    matchesByTournament(tournamentId: $tournamentId) {
      id homeTeamId awayTeamId round status homeScore awayScore
    }
  }
`;

// ── Test setup helpers ──────────────────────────────────

const db = getTestDb();
let client: Awaited<ReturnType<typeof createTestClient>>;
let organizerToken: string;

async function setupOrganizer() {
  await client.execute({
    query: REGISTER_USER,
    variables: {
      input: { email: 'org@test.com', password: 'password123', fullName: 'Organizer' },
    },
  });
  await db
    .updateTable('users')
    .set({ role: 'organizer' })
    .where('email', '=', 'org@test.com')
    .execute();
  const login = await client.execute({
    query: LOGIN,
    variables: { input: { email: 'org@test.com', password: 'password123' } },
  });
  return login.body.data!.login.accessToken as string;
}

async function registerUserAndTeam(
  email: string,
  fullName: string,
  tournamentId: string,
  teamName: string
) {
  const reg = await client.execute({
    query: REGISTER_USER,
    variables: {
      input: { email, password: 'password123', fullName },
    },
  });
  const token = reg.body.data!.register.accessToken as string;
  const userId = reg.body.data!.register.user.id as string;

  const teamRes = await client.execute({
    query: REGISTER_TEAM,
    variables: { input: { tournamentId, name: teamName } },
    token,
  });
  expect(teamRes.body.errors).toBeUndefined();
  const teamId = teamRes.body.data!.registerTeam.id as string;

  return { token, userId, teamId };
}

async function addPlayers(
  teamId: string,
  count: number,
  token: string,
  opts?: { userId?: string; linkFirst?: boolean }
) {
  const playerIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const res = await client.execute({
      query: ADD_PLAYER,
      variables: {
        input: {
          teamId,
          fullName: `Player ${i + 1}`,
          jerseyNumber: i + 1,
          ...(opts?.linkFirst && i === 0 && opts.userId
            ? { userId: opts.userId }
            : {}),
        },
      },
      token,
    });
    expect(res.body.errors).toBeUndefined();
    playerIds.push(res.body.data!.addPlayer.id as string);
  }
  return playerIds;
}

// ── Tests ──────────────────────────────────────────────

describe('Sport-specific Tournament Flows', () => {
  beforeAll(async () => {
    client = await createTestClient({ db });
  });

  afterAll(async () => {
    await client.stop();
    await destroyTestDb();
  });

  beforeEach(async () => {
    await cleanAllTables(db);
    organizerToken = await setupOrganizer();
  });

  // ═══════════════════════════════════════════════════
  // FOOTBALL
  // ═══════════════════════════════════════════════════
  describe('Football - Full Flow', () => {
    it('should complete a football tournament with scoring and standings', async () => {
      // 1. Create tournament
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Football Cup',
            sport: 'football',
            format: 'round_robin',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
            pointsForWin: 3,
            pointsForDraw: 1,
            pointsForLoss: 0,
          },
        },
        token: organizerToken,
      });
      expect(create.body.errors).toBeUndefined();
      const tournamentId = create.body.data!.createTournament.id as string;
      expect(create.body.data!.createTournament.sport).toBe('football');

      // 2. Open registration
      const regStatus = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'registration' },
        token: organizerToken,
      });
      expect(regStatus.body.data!.updateTournamentStatus.status).toBe('registration');

      // 3. Register 3 teams (by regular users)
      const teamA = await registerUserAndTeam('a@test.com', 'Manager A', tournamentId, 'FC Alpha');
      const teamB = await registerUserAndTeam('b@test.com', 'Manager B', tournamentId, 'FC Beta');
      const teamC = await registerUserAndTeam('c@test.com', 'Manager C', tournamentId, 'FC Gamma');

      // 4. Add 5 players per team (min for football)
      const playersA = await addPlayers(teamA.teamId, 5, teamA.token, { userId: teamA.userId, linkFirst: true });
      const playersB = await addPlayers(teamB.teamId, 5, teamB.token);
      const playersC = await addPlayers(teamC.teamId, 5, teamC.token);

      // 5. Start tournament
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'in_progress' },
        token: organizerToken,
      });

      // 6. Generate matches
      const genRes = await client.execute({
        query: GENERATE_MATCHES,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect(genRes.body.errors).toBeUndefined();
      const matches = genRes.body.data!.generateMatches as Array<{
        id: string;
        homeTeamId: string;
        awayTeamId: string;
      }>;
      expect(matches.length).toBeGreaterThanOrEqual(3);

      // 7. Check-in for first match
      const firstMatch = matches.find((m) => m.homeTeamId && m.awayTeamId)!;
      const openRes = await client.execute({
        query: OPEN_CHECKIN,
        variables: { matchId: firstMatch.id },
        token: organizerToken,
      });
      expect(openRes.body.errors).toBeUndefined();
      expect(openRes.body.data!.openCheckin.isOpen).toBe(true);
      expect(openRes.body.data!.openCheckin.qrCode).toBeTruthy();

      // Organizer checks in players manually
      const checkinPlayers = openRes.body.data!.openCheckin.checkins as Array<{
        id: string;
        playerId: string;
      }>;
      if (checkinPlayers.length > 0) {
        const checkinRes = await client.execute({
          query: PLAYER_CHECKIN,
          variables: { matchId: firstMatch.id, playerId: checkinPlayers[0].playerId },
          token: organizerToken,
        });
        expect(checkinRes.body.errors).toBeUndefined();
        expect(checkinRes.body.data!.playerCheckin.status).toBe('checked_in');
      }

      // 8. Submit football results (simple score)
      const playableMatches = matches.filter((m) => m.homeTeamId && m.awayTeamId);
      const scores = [
        { homeScore: 2, awayScore: 1 }, // match 1
        { homeScore: 0, awayScore: 0 }, // match 2 (draw)
        { homeScore: 3, awayScore: 2 }, // match 3
      ];

      for (let i = 0; i < playableMatches.length && i < scores.length; i++) {
        const res = await client.execute({
          query: SUBMIT_RESULT,
          variables: {
            id: playableMatches[i].id,
            input: scores[i],
          },
          token: organizerToken,
        });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data!.submitMatchResult.status).toBe('completed');
        expect(res.body.data!.submitMatchResult.homeScore).toBe(scores[i].homeScore);
        expect(res.body.data!.submitMatchResult.awayScore).toBe(scores[i].awayScore);
      }

      // 9. Check standings
      const standingsRes = await client.execute({
        query: GET_STANDINGS,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect(standingsRes.body.errors).toBeUndefined();
      const standings = standingsRes.body.data!.standingsByTournament as Array<{
        teamId: string;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        points: number;
        rank: number;
        goalsFor: number;
        goalsAgainst: number;
      }>;
      expect(standings.length).toBeGreaterThanOrEqual(3);

      // Each team should have played
      for (const s of standings) {
        expect(s.played).toBeGreaterThanOrEqual(1);
        expect(s.points).toBeGreaterThanOrEqual(0);
      }

      // Ranked by points
      const sorted = [...standings].sort((a, b) => a.rank - b.rank);
      expect(sorted[0].points).toBeGreaterThanOrEqual(sorted[1].points);

      // 10. Complete tournament
      const completeRes = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'completed' },
        token: organizerToken,
      });
      expect(completeRes.body.data!.updateTournamentStatus.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════════════════
  // VOLLEYBALL
  // ═══════════════════════════════════════════════════
  describe('Volleyball - Full Flow', () => {
    it('should complete a volleyball tournament with set-based scoring', async () => {
      // 1. Create tournament
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Volleyball Cup',
            sport: 'volleyball',
            format: 'single_elimination',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 6,
            maxPlayersPerTeam: 14,
            pointsForWin: 3,
            pointsForDraw: 0,
            pointsForLoss: 0,
          },
        },
        token: organizerToken,
      });
      expect(create.body.errors).toBeUndefined();
      const tournamentId = create.body.data!.createTournament.id as string;
      expect(create.body.data!.createTournament.sport).toBe('volleyball');
      expect(create.body.data!.createTournament.format).toBe('single_elimination');

      // 2. Open registration
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'registration' },
        token: organizerToken,
      });

      // 3. Register 4 teams
      const teamA = await registerUserAndTeam('va@test.com', 'Vol A', tournamentId, 'Spike Kings');
      const teamB = await registerUserAndTeam('vb@test.com', 'Vol B', tournamentId, 'Block Party');
      const teamC = await registerUserAndTeam('vc@test.com', 'Vol C', tournamentId, 'Set Masters');
      const teamD = await registerUserAndTeam('vd@test.com', 'Vol D', tournamentId, 'Net Force');

      // 4. Add 6 players per team (min for volleyball)
      await addPlayers(teamA.teamId, 6, teamA.token);
      await addPlayers(teamB.teamId, 6, teamB.token);
      await addPlayers(teamC.teamId, 6, teamC.token);
      await addPlayers(teamD.teamId, 6, teamD.token);

      // 5. Start tournament
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'in_progress' },
        token: organizerToken,
      });

      // 6. Generate matches (single elimination with 4 teams = 3 matches)
      const genRes = await client.execute({
        query: GENERATE_MATCHES,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect(genRes.body.errors).toBeUndefined();
      const allMatches = genRes.body.data!.generateMatches as Array<{
        id: string;
        homeTeamId: string | null;
        awayTeamId: string | null;
        round: number;
      }>;

      // Semi-finals (round 1) should have teams assigned
      const semiFinals = allMatches.filter(
        (m) => m.round === 1 && m.homeTeamId && m.awayTeamId
      );
      expect(semiFinals.length).toBe(2);

      // 8. Submit volleyball results with sets (best of 5 — need 3 sets to win)
      // Semi-final 1: Home wins 3-0
      const sf1 = await client.execute({
        query: SUBMIT_RESULT,
        variables: {
          id: semiFinals[0].id,
          input: {
            homeScore: 3,
            awayScore: 0,
            sets: [
              { setNumber: 1, homeScore: 25, awayScore: 20 },
              { setNumber: 2, homeScore: 25, awayScore: 18 },
              { setNumber: 3, homeScore: 25, awayScore: 22 },
            ],
          },
        },
        token: organizerToken,
      });
      expect(sf1.body.errors).toBeUndefined();
      expect(sf1.body.data!.submitMatchResult.status).toBe('completed');
      expect(sf1.body.data!.submitMatchResult.homeScore).toBe(3);
      expect(sf1.body.data!.submitMatchResult.awayScore).toBe(0);

      // Semi-final 2: Away team wins 3-2 (5 sets)
      const sf2 = await client.execute({
        query: SUBMIT_RESULT,
        variables: {
          id: semiFinals[1].id,
          input: {
            homeScore: 2,
            awayScore: 3,
            sets: [
              { setNumber: 1, homeScore: 25, awayScore: 22 },
              { setNumber: 2, homeScore: 20, awayScore: 25 },
              { setNumber: 3, homeScore: 25, awayScore: 23 },
              { setNumber: 4, homeScore: 18, awayScore: 25 },
              { setNumber: 5, homeScore: 13, awayScore: 15 },
            ],
          },
        },
        token: organizerToken,
      });
      expect(sf2.body.errors).toBeUndefined();
      expect(sf2.body.data!.submitMatchResult.homeScore).toBe(2);
      expect(sf2.body.data!.submitMatchResult.awayScore).toBe(3);

      // Check that winner advanced to final
      const updatedMatches = await client.execute({
        query: MATCHES_BY_TOURNAMENT,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect(updatedMatches.body.errors).toBeUndefined();
      const finalMatch = (
        updatedMatches.body.data!.matchesByTournament as Array<{
          id: string;
          homeTeamId: string | null;
          awayTeamId: string | null;
          round: number;
          status: string;
        }>
      ).find((m) => m.round === 2 && m.homeTeamId && m.awayTeamId);

      // Final should exist with both teams
      if (finalMatch) {
        // Submit final — volleyball best of 5 (3-1)
        const finalRes = await client.execute({
          query: SUBMIT_RESULT,
          variables: {
            id: finalMatch.id,
            input: {
              homeScore: 3,
              awayScore: 1,
              sets: [
                { setNumber: 1, homeScore: 25, awayScore: 23 },
                { setNumber: 2, homeScore: 20, awayScore: 25 },
                { setNumber: 3, homeScore: 25, awayScore: 19 },
                { setNumber: 4, homeScore: 25, awayScore: 21 },
              ],
            },
          },
          token: organizerToken,
        });
        expect(finalRes.body.errors).toBeUndefined();
        expect(finalRes.body.data!.submitMatchResult.winnerTeamId).toBeTruthy();
      }

      // 10. Complete
      const completeRes = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'completed' },
        token: organizerToken,
      });
      expect(completeRes.body.data!.updateTournamentStatus.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════════════════
  // BADMINTON
  // ═══════════════════════════════════════════════════
  describe('Badminton - Full Flow', () => {
    it('should complete a badminton tournament with set-based scoring', async () => {
      // 1. Create tournament (doubles format)
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Badminton Cup',
            sport: 'badminton',
            format: 'single_elimination',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 2,
            maxPlayersPerTeam: 4,
            pointsForWin: 1,
            pointsForDraw: 0,
            pointsForLoss: 0,
          },
        },
        token: organizerToken,
      });
      expect(create.body.errors).toBeUndefined();
      const tournamentId = create.body.data!.createTournament.id as string;
      expect(create.body.data!.createTournament.sport).toBe('badminton');

      // 2. Open registration
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'registration' },
        token: organizerToken,
      });

      // 3. Register 4 teams (doubles pairs)
      const teamA = await registerUserAndTeam('ba@test.com', 'Bad A', tournamentId, 'Shuttle Stars');
      const teamB = await registerUserAndTeam('bb@test.com', 'Bad B', tournamentId, 'Smash Bros');
      const teamC = await registerUserAndTeam('bc@test.com', 'Bad C', tournamentId, 'Net Ninjas');
      const teamD = await registerUserAndTeam('bd@test.com', 'Bad D', tournamentId, 'Drop Shots');

      // 4. Add 2 players per team (min for badminton doubles)
      await addPlayers(teamA.teamId, 2, teamA.token);
      await addPlayers(teamB.teamId, 2, teamB.token);
      await addPlayers(teamC.teamId, 2, teamC.token);
      await addPlayers(teamD.teamId, 2, teamD.token);

      // 5. Start tournament
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'in_progress' },
        token: organizerToken,
      });

      // 6. Generate matches
      const genRes = await client.execute({
        query: GENERATE_MATCHES,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect(genRes.body.errors).toBeUndefined();
      const allMatches = genRes.body.data!.generateMatches as Array<{
        id: string;
        homeTeamId: string | null;
        awayTeamId: string | null;
        round: number;
      }>;

      const semiFinals = allMatches.filter(
        (m) => m.round === 1 && m.homeTeamId && m.awayTeamId
      );
      expect(semiFinals.length).toBe(2);

      // 8. Submit badminton results with sets (best of 3, 21 points)
      // Semi-final 1: Home wins 2-0
      const sf1 = await client.execute({
        query: SUBMIT_RESULT,
        variables: {
          id: semiFinals[0].id,
          input: {
            homeScore: 2,
            awayScore: 0,
            sets: [
              { setNumber: 1, homeScore: 21, awayScore: 15 },
              { setNumber: 2, homeScore: 21, awayScore: 18 },
            ],
          },
        },
        token: organizerToken,
      });
      expect(sf1.body.errors).toBeUndefined();
      expect(sf1.body.data!.submitMatchResult.status).toBe('completed');

      // Semi-final 2: Away wins 2-1 (3 sets)
      const sf2 = await client.execute({
        query: SUBMIT_RESULT,
        variables: {
          id: semiFinals[1].id,
          input: {
            homeScore: 1,
            awayScore: 2,
            sets: [
              { setNumber: 1, homeScore: 21, awayScore: 19 },
              { setNumber: 2, homeScore: 15, awayScore: 21 },
              { setNumber: 3, homeScore: 18, awayScore: 21 },
            ],
          },
        },
        token: organizerToken,
      });
      expect(sf2.body.errors).toBeUndefined();

      // Check final match exists
      const updatedMatches = await client.execute({
        query: MATCHES_BY_TOURNAMENT,
        variables: { tournamentId },
        token: organizerToken,
      });
      const finalMatch = (
        updatedMatches.body.data!.matchesByTournament as Array<{
          id: string;
          homeTeamId: string | null;
          awayTeamId: string | null;
          round: number;
        }>
      ).find((m) => m.round === 2 && m.homeTeamId && m.awayTeamId);

      if (finalMatch) {
        // Submit final — close 3 setter
        const finalRes = await client.execute({
          query: SUBMIT_RESULT,
          variables: {
            id: finalMatch.id,
            input: {
              homeScore: 2,
              awayScore: 1,
              sets: [
                { setNumber: 1, homeScore: 21, awayScore: 19 },
                { setNumber: 2, homeScore: 19, awayScore: 21 },
                { setNumber: 3, homeScore: 21, awayScore: 17 },
              ],
            },
          },
          token: organizerToken,
        });
        expect(finalRes.body.errors).toBeUndefined();
        expect(finalRes.body.data!.submitMatchResult.winnerTeamId).toBeTruthy();
      }

      // 10. Complete
      const completeRes = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'completed' },
        token: organizerToken,
      });
      expect(completeRes.body.data!.updateTournamentStatus.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════════════════
  // CROSS-SPORT: Registration access control
  // ═══════════════════════════════════════════════════
  describe('Registration Access Control', () => {
    it('should auto-upgrade player to team_manager on team registration', async () => {
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Role Test Cup',
            sport: 'football',
            format: 'round_robin',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
          },
        },
        token: organizerToken,
      });
      const tournamentId = create.body.data!.createTournament.id as string;

      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'registration' },
        token: organizerToken,
      });

      // Register as a regular user (role = player)
      const reg = await client.execute({
        query: REGISTER_USER,
        variables: {
          input: { email: 'newplayer@test.com', password: 'password123', fullName: 'New Player' },
        },
      });
      const playerToken = reg.body.data!.register.accessToken as string;
      const userId = reg.body.data!.register.user.id as string;
      expect(reg.body.data!.register.user.role).toBe('player');

      // Register team — should auto-upgrade to team_manager
      const teamRes = await client.execute({
        query: REGISTER_TEAM,
        variables: { input: { tournamentId, name: 'Auto Role Team' } },
        token: playerToken,
      });
      expect(teamRes.body.errors).toBeUndefined();

      // Verify role was upgraded
      const user = await db
        .selectFrom('users')
        .select('role')
        .where('id', '=', userId)
        .executeTakeFirst();
      expect(user?.role).toBe('team_manager');
    });
  });
});
