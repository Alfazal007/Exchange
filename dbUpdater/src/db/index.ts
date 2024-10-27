import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { envVariables } from '../helpers/envLoader';

export const db = drizzle(envVariables.databaseUrl);
