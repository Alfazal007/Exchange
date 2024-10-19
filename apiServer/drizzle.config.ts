import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { envVariables } from './src/config/envVariables';

export default defineConfig({
    out: './src/drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: envVariables.databaseUrl,
    },
    verbose: true,
    strict: true,
});

