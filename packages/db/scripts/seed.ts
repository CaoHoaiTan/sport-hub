import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Kysely } from 'kysely';
import { createDialect } from '../src/config.js';
import type { Database } from '../src/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(rootDir, '.env') });

async function seed() {
  const db = new Kysely<Database>({ dialect: createDialect() });

  const seedsDir = path.join(__dirname, '..', 'src', 'seeds');

  try {
    const { readdirSync } = await import('node:fs');
    const files = readdirSync(seedsDir)
      .filter((f) => f.endsWith('.ts'))
      .sort();

    for (const file of files) {
      console.log(`Running seed: ${file}`);
      const mod = await import(path.join(seedsDir, file));
      await mod.seed(db);
      console.log(`Seed "${file}" completed`);
    }
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }

  await db.destroy();
}

seed();
