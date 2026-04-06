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
      id
      name
      slug
      sport
      format
      status
      startDate
    }
  }
`;

const UPDATE_TOURNAMENT = `
  mutation UpdateTournament($id: ID!, $input: UpdateTournamentInput!) {
    updateTournament(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const LIST_TOURNAMENTS = `
  query ListTournaments($filter: TournamentFilter, $pagination: PaginationInput) {
    tournaments(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        status
      }
      total
    }
  }
`;

const tournamentInput = {
  name: 'Test Tournament',
  sport: 'football',
  format: 'round_robin',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  minPlayersPerTeam: 5,
  maxPlayersPerTeam: 11,
};

describe('Tournament Integration Tests', () => {
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

    // Register an organizer
    const result = await client.execute({
      query: REGISTER_MUTATION,
      variables: {
        input: {
          email: 'organizer@example.com',
          password: 'password123',
          fullName: 'Tournament Organizer',
        },
      },
    });

    const register = result.body.data!.register as Record<string, unknown>;
    const user = register.user as Record<string, unknown>;
    organizerToken = register.accessToken as string;

    // Update user role to organizer
    await db
      .updateTable('users')
      .set({ role: 'organizer' })
      .where('id', '=', user.id as string)
      .execute();

    // Re-login to get token with updated role
    const loginResult = await client.execute({
      query: `mutation Login($input: LoginInput!) {
        login(input: $input) { accessToken user { id role } }
      }`,
      variables: {
        input: {
          email: 'organizer@example.com',
          password: 'password123',
        },
      },
    });
    const login = loginResult.body.data!.login as Record<string, unknown>;
    organizerToken = login.accessToken as string;
  });

  describe('Create Tournament', () => {
    it('should create a tournament as organizer', async () => {
      const result = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: { input: tournamentInput },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const tournament = result.body.data!.createTournament as Record<string, unknown>;
      expect(tournament.name).toBe('Test Tournament');
      expect(tournament.sport).toBe('football');
      expect(tournament.format).toBe('round_robin');
      expect(tournament.status).toBe('draft');
      expect(tournament.slug).toBeTruthy();
    });

    it('should fail to create tournament without auth', async () => {
      const result = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: { input: tournamentInput },
      });

      expect(result.body.errors).toBeDefined();
    });
  });

  describe('Update Tournament', () => {
    it('should update tournament details', async () => {
      const createResult = await client.execute({
        query: CREATE_TOURNAMENT,
        variables: { input: tournamentInput },
        token: organizerToken,
      });

      const created = createResult.body.data!.createTournament as Record<string, unknown>;

      const result = await client.execute({
        query: UPDATE_TOURNAMENT,
        variables: {
          id: created.id,
          input: {
            name: 'Updated Tournament',
            description: 'New description',
          },
        },
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const updated = result.body.data!.updateTournament as Record<string, unknown>;
      expect(updated.name).toBe('Updated Tournament');
      expect(updated.description).toBe('New description');
    });
  });

  describe('List Tournaments', () => {
    it('should list tournaments', async () => {
      // Create a couple tournaments
      await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: { ...tournamentInput, name: 'Tournament 1' },
        },
        token: organizerToken,
      });

      await client.execute({
        query: CREATE_TOURNAMENT,
        variables: {
          input: { ...tournamentInput, name: 'Tournament 2' },
        },
        token: organizerToken,
      });

      const result = await client.execute({
        query: LIST_TOURNAMENTS,
        token: organizerToken,
      });

      expect(result.body.errors).toBeUndefined();
      const tournaments = result.body.data!.tournaments as Record<string, unknown>;
      const items = tournaments.items as unknown[];
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });
});
