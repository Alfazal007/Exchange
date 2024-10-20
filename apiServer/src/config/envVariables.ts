import {configDotenv} from "dotenv";

configDotenv({
    path: ".env"
});

export const envVariables = {
    port: process.env.PORT as string,
    corsOrigin: process.env.CORS_ORIGIN as string,
    databaseUrl: process.env.DATABASE_URL as string,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY as string
}
