import { Pool, PoolClient } from "pg";
import { envVariables } from "./envVariables";

const databasePool = new Pool({
    user: envVariables.database_user,
    host: envVariables.database_host,
    database: envVariables.database_database,
    password: envVariables.database_password,
    port: parseInt(envVariables.database_port),
    max: 10
});


export async function initDatabase() {
    const client = await databasePool.connect();
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS trades (
            time        TIMESTAMPTZ        NOT NULL,
            token       TEXT               NOT NULL,
            amount      TEXT               NOT NULL
        );
        SELECT create_hypertable('trades', 'time');
    `;

    try {
        await client.query(createTableQuery);
        console.log("Hypertable created successfully!");
    } catch (err) {
        console.error("Error creating hypertable", err);
    } finally {
        client.release();
    }
}

export async function insertDataToTSDB(time: Date, token: string, amount: string) {
    const client = await databasePool.connect();
    const insertQuery = `
        INSERT INTO trades (time, token, amount)
        VALUES ($1, $2, $3) RETURNING *;
    `;

    const values = [time, token, amount];

    try {
        await client.query(insertQuery, values);
    } catch (err) {
        console.error("Error inserting data", err);
    } finally {
        client.release();
    }
}
