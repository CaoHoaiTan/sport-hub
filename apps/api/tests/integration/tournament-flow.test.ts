import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestDb, cleanAllTables, destroyTestDb } from '../helpers/test-db.js';
import { createTestClient } from '../helpers/test-client.js';

/**
 * End-to-end tournament lifecycle test:
 * Create → Open Registration → Register Teams → Start → Generate Matches →
 * Submit Results → Check Standings → Complete
 */

const REGISTER_USER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user { id email role }
    }
  }
`;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { accessToken user { id role } }
  }
`;

const CREATE_TOURNAMENT = `
  mutation CreateTournament($input: CreateTournamentInput!) {
    createTournament(input: $input) {
      id name slug status format sport
    }
  }
`;

const UPDATE_STATUS = `
  mutation UpdateTournamentStatus($id: ID!, $status: TournamentStatus!) {
    updateTournamentStatus(id: $id, status: $status) { id status }
  }
`;

const GET_TOURNAMENT = `
  query GetTournament($id: ID!) {
    tournament(id: $id) { id name status }
  }
`;

const REGISTER_TEAM = `
  mutation RegisterTeam($input: RegisterTeamInput!) {
    registerTeam(input: $input) { id name managerId }
  }
`;

const ADD_PLAYER = `
  mutation AddPlayer($input: AddPlayerInput!) {
    addPlayer(input: $input) { id fullName jerseyNumber teamId }
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
      id status homeScore awayScore
    }
  }
`;

const GET_STANDINGS = `
  query GetStandings($tournamentId: ID!) {
    standingsByTournament(tournamentId: $tournamentId) {
      teamId
      team { id name }
      played won drawn lost
      goalsFor goalsAgainst goalDifference points
      rank
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

describe('Full Tournament Lifecycle', () => {
  const db = getTestDb();
  let client: Awaited<ReturnType<typeof createTestClient>>;
  let organizerToken: string;

  beforeAll(async () => {
    client = await createTestClient({ db });
  });

  afterAll(async () => {
    await client.stop();
    await destroyTestDb();
  });

  beforeEach(async () => {
    await cleanAllTables(db);

    // Create and login organizer
    await client.execute({
      query: REGISTER_USER,
      variables: {
        input: {
          email: 'org@test.com',
          password: 'password123',
          fullName: 'Organizer',
        },
      },
    });
    await db
      .updateTable('users')
      .set({ role: 'organizer' })
      .where('email', '=', 'org@test.com')
      .execute();
    const login = await client.execute({
      query: LOGIN,
      variables: {
        input: { email: 'org@test.com', password: 'password123' },
      },
    });
    organizerToken = login.body.data!.login.accessToken;
  });

  describe('Tournament Status Transitions', () => {
    it('should follow draft → registration → in_progress → completed', async () => {
      // Create tournament (draft)
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Lifecycle Cup',
            sport: 'football',
            format: 'round_robin',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
          },
        },
        token: organizerToken,
      });
      expect(create.body.errors).toBeUndefined();
      const tid = create.body.data!.createTournament.id;
      expect(create.body.data!.createTournament.status).toBe('draft');

      // draft → registration
      const reg = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tid, status: 'registration' },
        token: organizerToken,
      });
      expect(reg.body.errors).toBeUndefined();
      expect(reg.body.data!.updateTournamentStatus.status).toBe('registration');

      // registration → in_progress
      const start = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tid, status: 'in_progress' },
        token: organizerToken,
      });
      expect(start.body.errors).toBeUndefined();
      expect(start.body.data!.updateTournamentStatus.status).toBe('in_progress');

      // in_progress → completed
      const complete = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tid, status: 'completed' },
        token: organizerToken,
      });
      expect(complete.body.errors).toBeUndefined();
      expect(complete.body.data!.updateTournamentStatus.status).toBe('completed');
    });

    it('should allow cancellation from any active status', async () => {
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Cancel Cup',
            sport: 'football',
            format: 'round_robin',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
          },
        },
        token: organizerToken,
      });
      const tid = create.body.data!.createTournament.id;

      const cancel = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tid, status: 'cancelled' },
        token: organizerToken,
      });
      expect(cancel.body.errors).toBeUndefined();
      expect(cancel.body.data!.updateTournamentStatus.status).toBe('cancelled');
    });
  });

  describe('Round Robin Full Flow', () => {
    let tournamentId: string;
    const teamIds: string[] = [];

    it('should complete a full round-robin tournament', async () => {
      // Step 1: Create tournament
      const create = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Round Robin Cup',
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
      tournamentId = create.body.data!.createTournament.id;

      // Step 2: Open registration
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'registration' },
        token: organizerToken,
      });

      // Step 3: Register 3 teams
      for (let i = 0; i < 3; i++) {
        const userRes = await client.execute({
          query: REGISTER_USER,
          variables: {
            input: {
              email: `manager${i}@test.com`,
              password: 'password123',
              fullName: `Manager ${i}`,
            },
          },
        });
        const token = userRes.body.data!.register.accessToken;

        const teamRes = await client.execute({
          query: REGISTER_TEAM,
          variables: {
            input: { tournamentId, name: `Team ${String.fromCharCode(65 + i)}` },
          },
          token,
        });
        expect(teamRes.body.errors).toBeUndefined();
        teamIds.push(teamRes.body.data!.registerTeam.id);

        // Add minimum players (5 for football)
        for (let p = 0; p < 5; p++) {
          await client.execute({
            query: ADD_PLAYER,
            variables: {
              input: {
                teamId: teamIds[i],
                fullName: `Player ${i}-${p}`,
                jerseyNumber: p + 1,
              },
            },
            token,
          });
        }
      }

      // Verify 3 teams registered
      expect(teamIds).toHaveLength(3);

      // Step 4: Start tournament
      const startRes = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'in_progress' },
        token: organizerToken,
      });
      expect(startRes.body.errors).toBeUndefined();

      // Step 5: Generate matches
      const matchRes = await client.execute({
        query: GENERATE_MATCHES,
        variables: { tournamentId },
        token: organizerToken,
      });
      expect(matchRes.body.errors).toBeUndefined();
      const matches = matchRes.body.data!.generateMatches as Array<{
        id: string;
        homeTeamId: string;
        awayTeamId: string;
        round: number;
      }>;
      // Round-robin with 3 teams generates matches (may include bye rounds)
      expect(matches.length).toBeGreaterThanOrEqual(3);

      // Step 6: Submit results for all matches that have both teams
      const playableMatches = matches.filter(
        (m) => m.homeTeamId && m.awayTeamId
      );

      for (const match of playableMatches) {
        const res = await client.execute({
          query: SUBMIT_RESULT,
          variables: {
            id: match.id,
            input: { homeScore: 2, awayScore: 1 },
          },
          token: organizerToken,
        });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data!.submitMatchResult.status).toBe('completed');
      }

      // Step 7: Check standings
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
        points: number;
        rank: number;
      }>;
      expect(standings.length).toBeGreaterThanOrEqual(3);
      // Each team should have played at least 1 match
      for (const s of standings) {
        expect(s.played).toBeGreaterThanOrEqual(1);
      }
      // Rank 1 should have the most points
      const ranked = [...standings].sort((a, b) => a.rank - b.rank);
      expect(ranked[0].points).toBeGreaterThanOrEqual(ranked[1].points);

      // Step 8: Complete tournament
      const completeRes = await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'completed' },
        token: organizerToken,
      });
      expect(completeRes.body.errors).toBeUndefined();
      expect(completeRes.body.data!.updateTournamentStatus.status).toBe('completed');

      // Verify final state
      const finalRes = await client.execute({
        query: GET_TOURNAMENT,
        variables: { id: tournamentId },
        token: organizerToken,
      });
      expect(finalRes.body.data!.tournament.status).toBe('completed');
    });
  });

  describe('Player Management', () => {
    it('should add players to a team', async () => {
      // Setup tournament + team
      const tRes = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Player Cup',
            sport: 'football',
            format: 'round_robin',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
          },
        },
        token: organizerToken,
      });
      const tid = tRes.body.data!.createTournament.id;

      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tid, status: 'registration' },
        token: organizerToken,
      });

      // Register user + team
      const uRes = await client.execute({
        query: REGISTER_USER,
        variables: {
          input: {
            email: 'captain@test.com',
            password: 'password123',
            fullName: 'Captain',
          },
        },
      });
      const captainToken = uRes.body.data!.register.accessToken;

      const teamRes = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: { tournamentId: tid, name: 'Captain FC' },
        },
        token: captainToken,
      });
      const teamId = teamRes.body.data!.registerTeam.id;

      // Add player
      const playerRes = await client.execute({
        query: ADD_PLAYER,
        variables: {
          input: {
            teamId,
            fullName: 'Star Player',
            jerseyNumber: 10,
            position: 'forward',
          },
        },
        token: captainToken,
      });
      expect(playerRes.body.errors).toBeUndefined();
      expect(playerRes.body.data!.addPlayer.fullName).toBe('Star Player');
      expect(playerRes.body.data!.addPlayer.jerseyNumber).toBe(10);
      expect(playerRes.body.data!.addPlayer.teamId).toBe(teamId);
    });

    it('should add player without position', async () => {
      const tRes = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'NoPos Cup',
            sport: 'football',
            format: 'round_robin',
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
          },
        },
        token: organizerToken,
      });
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tRes.body.data!.createTournament.id, status: 'registration' },
        token: organizerToken,
      });

      const teamRes = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: {
            tournamentId: tRes.body.data!.createTournament.id,
            name: 'NoPos Team',
          },
        },
        token: organizerToken,
      });
      const teamId = teamRes.body.data!.registerTeam.id;

      const playerRes = await client.execute({
        query: ADD_PLAYER,
        variables: {
          input: {
            teamId,
            fullName: 'No Position',
            jerseyNumber: 99,
          },
        },
        token: organizerToken,
      });
      expect(playerRes.body.errors).toBeUndefined();
      expect(playerRes.body.data!.addPlayer.fullName).toBe('No Position');
    });
  });
});
