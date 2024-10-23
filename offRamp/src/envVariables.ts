import {configDotenv} from "dotenv";

configDotenv({
    path: ".env"
});

export const envVariables = {
    databaseUrl: process.env.DATABASE_URL as string,
    redisUrl: process.env.REDIS_URL as string,
    connectionUrl: process.env.CONNECTION_UR as string,
    secretKey: process.env.SECRET_KEY as string
}
