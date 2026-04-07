import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestDb, cleanAllTables, destroyTestDb } from '../helpers/test-db.js';
import { createTestClient } from '../helpers/test-client.js';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user { id email role }
    }
  }
`;

const CREATE_TOURNAMENT = `
  mutation CreateTournament($input: CreateTournamentInput!) {
    createTournament(input: $input) {
      id name slug status maxTeams
    }
  }
`;

const UPDATE_STATUS = `
  mutation UpdateTournamentStatus($id: ID!, $status: TournamentStatus!) {
    updateTournamentStatus(id: $id, status: $status) {
      id status
    }
  }
`;

const REGISTER_TEAM = `
  mutation RegisterTeam($input: RegisterTeamInput!) {
    registerTeam(input: $input) {
      id name managerId tournamentId
    }
  }
`;

const DELETE_TEAM = `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`;

const TEAMS_BY_TOURNAMENT = `
  query TeamsByTournament($tournamentId: ID!) {
    teamsByTournament(tournamentId: $tournamentId) {
      id name managerId groupName seed
    }
  }
`;

const DRAW_GROUPS = `
  mutation DrawGroups($tournamentId: ID!, $groupCount: Int!) {
    drawGroups(tournamentId: $tournamentId, groupCount: $groupCount) {
      id name groupName seed
    }
  }
`;

describe('Team Integration Tests', () => {
  const db = getTestDb();
  let client: Awaited<ReturnType<typeof createTestClient>>;
  let organizerToken: string;
  let playerToken: string;
  let tournamentId: string;

  beforeAll(async () => {
    client = await createTestClient({ db });
  });

  afterAll(async () => {
    await client.stop();
    await destroyTestDb();
  });

  beforeEach(async () => {
    await cleanAllTables(db);

    // Create organizer (admin role can create tournaments)
    const orgResult = await client.execute({
      query: REGISTER_MUTATION,
      variables: {
        input: {
          email: 'organizer@test.com',
          password: 'password123',
          fullName: 'Test Organizer',
        },
      },
    });
    organizerToken = orgResult.body.data!.register.accessToken;
    // Upgrade to organizer role
    await db
      .updateTable('users')
      .set({ role: 'organizer' })
      .where('email', '=', 'organizer@test.com')
      .execute();
    // Re-login to get token with updated role
    const orgLogin = await client.execute({
      query: `mutation Login($input: LoginInput!) {
        login(input: $input) { accessToken user { id role } }
      }`,
      variables: {
        input: { email: 'organizer@test.com', password: 'password123' },
      },
    });
    organizerToken = orgLogin.body.data!.login.accessToken;

    // Create regular player user
    const playerResult = await client.execute({
      query: REGISTER_MUTATION,
      variables: {
        input: {
          email: 'player@test.com',
          password: 'password123',
          fullName: 'Test Player',
        },
      },
    });
    playerToken = playerResult.body.data!.register.accessToken;

    // Create tournament in registration status
    const tResult = await client.execute({
      query: CREATE_TOURNAMENT,
      variables: {
        input: {
          name: 'Test Cup',
          sport: 'football',
          format: 'round_robin',
          startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          minPlayersPerTeam: 5,
          maxPlayersPerTeam: 11,
          maxTeams: 4,
        },
      },
      token: organizerToken,
    });
    tournamentId = tResult.body.data!.createTournament.id;

    // Open registration
    await client.execute({
      query: UPDATE_STATUS,
      variables: { id: tournamentId, status: 'registration' },
      token: organizerToken,
    });
  });

  describe('Register Team', () => {
    it('should allow any authenticated user to register a team', async () => {
      const result = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: { tournamentId, name: 'Player Team' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data!.registerTeam.name).toBe('Player Team');
      expect(result.body.data!.registerTeam.tournamentId).toBe(tournamentId);
    });

    it('should allow organizer to register a team', async () => {
      const result = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: { tournamentId, name: 'Org Team' },
        },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data!.registerTeam.name).toBe('Org Team');
    });

    it('should reject unauthenticated registration', async () => {
      const result = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: { tournamentId, name: 'Ghost Team' },
        },
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('should reject registration when tournament is not in registration status', async () => {
      // Move to in_progress
      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: tournamentId, status: 'in_progress' },
        token: organizerToken,
      });

      const result = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: { tournamentId, name: 'Late Team' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('not accepting registrations');
    });

    it('should reject registration when max teams reached', async () => {
      // Register 4 teams (max)
      for (let i = 0; i < 4; i++) {
        const u = await client.execute({
          query: REGISTER_MUTATION,
          variables: {
            input: {
              email: `team${i}@test.com`,
              password: 'password123',
              fullName: `Manager ${i}`,
            },
          },
        });
        await client.execute({
          query: REGISTER_TEAM,
          variables: {
            input: { tournamentId, name: `Team ${i}` },
          },
          token: u.body.data!.register.accessToken,
        });
      }

      // 5th team should fail
      const result = await client.execute({
        query: REGISTER_TEAM,
        variables: {
          input: { tournamentId, name: 'Team Overflow' },
        },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('maximum number of teams');
    });
  });

  describe('List Teams', () => {
    it('should list all teams in a tournament', async () => {
      await client.execute({
        query: REGISTER_TEAM,
        variables: { input: { tournamentId, name: 'Team A' } },
        token: playerToken,
      });
      await client.execute({
        query: REGISTER_TEAM,
        variables: { input: { tournamentId, name: 'Team B' } },
        token: organizerToken,
      });

      const result = await client.execute({
        query: TEAMS_BY_TOURNAMENT,
        variables: { tournamentId },
      });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data!.teamsByTournament).toHaveLength(2);
    });
  });

  describe('Delete Team', () => {
    it('should allow team manager to delete own team', async () => {
      const reg = await client.execute({
        query: REGISTER_TEAM,
        variables: { input: { tournamentId, name: 'My Team' } },
        token: playerToken,
      });
      const teamId = reg.body.data!.registerTeam.id;

      const result = await client.execute({
        query: DELETE_TEAM,
        variables: { id: teamId },
        token: playerToken,
      });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data!.deleteTeam).toBe(true);
    });

    it('should reject deletion by non-manager', async () => {
      const reg = await client.execute({
        query: REGISTER_TEAM,
        variables: { input: { tournamentId, name: 'Other Team' } },
        token: organizerToken,
      });
      const teamId = reg.body.data!.registerTeam.id;

      const result = await client.execute({
        query: DELETE_TEAM,
        variables: { id: teamId },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].extensions?.code).toBe('FORBIDDEN');
    });
  });

  describe('Draw Groups', () => {
    it('should draw groups for group_stage_knockout tournament', async () => {
      // Create a group_stage_knockout tournament
      const tRes = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: {
            name: 'Group Cup',
            sport: 'football',
            format: 'group_stage_knockout',
            groupCount: 2,
            startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            minPlayersPerTeam: 5,
            maxPlayersPerTeam: 11,
          },
        },
        token: organizerToken,
      });
      expect(tRes.body.errors).toBeUndefined();
      const gTournamentId = tRes.body.data!.createTournament.id;

      await client.execute({
        query: UPDATE_STATUS,
        variables: { id: gTournamentId, status: 'registration' },
        token: organizerToken,
      });

      // Register 4 teams
      for (let i = 0; i < 4; i++) {
        const u = await client.execute({
          query: REGISTER_MUTATION,
          variables: {
            input: {
              email: `group${i}@test.com`,
              password: 'password123',
              fullName: `Player ${i}`,
            },
          },
        });
        await client.execute({
          query: REGISTER_TEAM,
          variables: {
            input: { tournamentId: gTournamentId, name: `Group Team ${i}` },
          },
          token: u.body.data!.register.accessToken,
        });
      }

      const result = await client.execute({
        query: DRAW_GROUPS,
        variables: { tournamentId: gTournamentId, groupCount: 2 },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const teams = result.body.data!.drawGroups as Array<{
        groupName: string;
        seed: number;
      }>;
      expect(teams).toHaveLength(4);
      // Every team should have a group and seed
      for (const team of teams) {
        expect(team.groupName).toBeTruthy();
        expect(team.seed).toBeGreaterThan(0);
      }
      // Should have 2 groups
      const groups = new Set(teams.map((t) => t.groupName));
      expect(groups.size).toBe(2);
    });

    it('should reject draw groups by non-organizer', async () => {
      const result = await client.execute({
        query: DRAW_GROUPS,
        variables: { tournamentId, groupCount: 2 },
        token: playerToken,
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].extensions?.code).toBe('FORBIDDEN');
    });
  });
});
