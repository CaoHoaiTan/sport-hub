import { defineConfig } from 'kysely-codegen';

export default defineConfig({
  dialectName: 'postgres',
  outFile: 'src/types/db.d.ts',
});
