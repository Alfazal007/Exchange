import { configDotenv } from "dotenv"

configDotenv({
    path: ".env"
});

export const envVariables = {
    database_user: process.env.DATABASE_USER as string,
    database_host: process.env.DATABASE_HOST as string,
    database_database: process.env.DATABASE_DATABASE as string,
    database_password: process.env.DATABASE_PASSWORD as string,
    database_port: process.env.DATABASE_PORT as string,
}

