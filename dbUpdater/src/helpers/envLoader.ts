import { configDotenv } from "dotenv";
configDotenv({
    path: ".env"
});

export const envVariables = {
    databaseUrl: process.env.DATABASE_URL as string
}
