import { drizzle } from 'drizzle-orm/node-postgres';
import { envVariables } from '../config/envVariables';

const db = drizzle(envVariables.databaseUrl!);

export { db }
