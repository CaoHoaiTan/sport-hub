import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestDb, cleanAllTables, destroyTestDb } from '../helpers/test-db.js';
import { createTestClient } from '../helpers/test-client.js';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
        role
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
      }
    }
  }
`;

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

describe('Auth Integration Tests', () => {
  const db = getTestDb();
  let client: Awaited<ReturnType<typeof createTestClient>>;

  beforeAll(async () => {
    client = await createTestClient({ db });
  });

  afterAll(async () => {
    await client.stop();
    await destroyTestDb();
  });

  beforeEach(async () => {
    await cleanAllTables(db);
  });

  describe('Register', () => {
    it('should register a new user successfully', async () => {
      const result = await client.execute({
        query: REGISTER_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
          },
        },
      });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data?.register).toBeDefined();
      const register = result.body.data!.register as Record<string, unknown>;
      expect(register.accessToken).toBeTruthy();
      expect(register.refreshToken).toBeTruthy();
      const user = register.user as Record<string, unknown>;
      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.role).toBe('player');
    });

    it('should fail to register with duplicate email', async () => {
      const input = {
        email: 'dup@example.com',
        password: 'password123',
        fullName: 'First User',
      };

      await client.execute({ query: REGISTER_MUTATION, variables: { input } });

      const result = await client.execute({
        query: REGISTER_MUTATION,
        variables: {
          input: { ...input, fullName: 'Second User' },
        },
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('already registered');
    });

    it('should fail to register with invalid email', async () => {
      const result = await client.execute({
        query: REGISTER_MUTATION,
        variables: {
          input: {
            email: 'not-an-email',
            password: 'password123',
            fullName: 'Test User',
          },
        },
      });

      expect(result.body.errors).toBeDefined();
    });

    it('should fail to register with short password', async () => {
      const result = await client.execute({
        query: REGISTER_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'short',
            fullName: 'Test User',
          },
        },
      });

      expect(result.body.errors).toBeDefined();
    });
  });

  describe('Login', () => {
    const testUser = {
      email: 'login@example.com',
      password: 'password123',
      fullName: 'Login User',
    };

    beforeEach(async () => {
      await client.execute({
        query: REGISTER_MUTATION,
        variables: { input: testUser },
      });
    });

    it('should login with correct credentials', async () => {
      const result = await client.execute({
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: testUser.email,
            password: testUser.password,
          },
        },
      });

      expect(result.body.errors).toBeUndefined();
      const login = result.body.data!.login as Record<string, unknown>;
      expect(login.accessToken).toBeTruthy();
      expect(login.refreshToken).toBeTruthy();
      const user = login.user as Record<string, unknown>;
      expect(user.email).toBe(testUser.email);
    });

    it('should fail with wrong password', async () => {
      const result = await client.execute({
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: testUser.email,
            password: 'wrongpassword',
          },
        },
      });

      expect(result.body.errors).toBeDefined();
      expect(result.body.errors![0].message).toContain('Invalid email or password');
    });

    it('should fail with non-existent email', async () => {
      const result = await client.execute({
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
        },
      });

      expect(result.body.errors).toBeDefined();
    });
  });

  describe('Refresh Token', () => {
    it('should refresh tokens successfully', async () => {
      const registerResult = await client.execute({
        query: REGISTER_MUTATION,
        variables: {
          input: {
            email: 'refresh@example.com',
            password: 'password123',
            fullName: 'Refresh User',
          },
        },
      });

      const register = registerResult.body.data!.register as Record<string, unknown>;
      const refreshToken = register.refreshToken as string;

      const result = await client.execute({
        query: REFRESH_TOKEN_MUTATION,
        variables: { token: refreshToken },
      });

      expect(result.body.errors).toBeUndefined();
      const refreshed = result.body.data!.refreshToken as Record<string, unknown>;
      expect(refreshed.accessToken).toBeTruthy();
      expect(refreshed.refreshToken).toBeTruthy();
      // New tokens should be different from original
      expect(refreshed.refreshToken).not.toBe(refreshToken);
    });

    it('should fail with invalid refresh token', async () => {
      const result = await client.execute({
        query: REFRESH_TOKEN_MUTATION,
        variables: { token: 'invalid-token' },
      });

      expect(result.body.errors).toBeDefined();
    });
  });

  describe('Logout', () => {
    it('should logout successfully when authenticated', async () => {
      const registerResult = await client.execute({
        query: REGISTER_MUTATION,
        variables: {
          input: {
            email: 'logout@example.com',
            password: 'password123',
            fullName: 'Logout User',
          },
        },
      });

      const register = registerResult.body.data!.register as Record<string, unknown>;
      const accessToken = register.accessToken as string;

      const result = await client.execute({
        query: LOGOUT_MUTATION,
        token: accessToken,
      });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data?.logout).toBe(true);
    });

    it('should fail to logout when not authenticated', async () => {
      const result = await client.execute({
        query: LOGOUT_MUTATION,
      });

      expect(result.body.errors).toBeDefined();
    });
  });
});
