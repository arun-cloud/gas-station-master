import "dotenv/config";

import pg from "pg";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("DIRECT_URL is missing from the root .env file.");
}

const pool = new pg.Pool({
    connectionString,
});

async function testConnection(): Promise<void> {
    try {
        const result = await pool.query<{
            database_name: string;
            database_user: string;
            server_time: Date;
        }>(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS server_time
    `);

        console.log("Supabase connection successful:");
        console.table(result.rows);
    } catch (error: unknown) {
        console.error("Supabase connection failed:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

void testConnection();