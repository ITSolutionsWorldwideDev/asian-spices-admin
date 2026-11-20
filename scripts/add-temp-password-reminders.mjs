import fs from "fs";
import path from "path";
import pg from "pg";

const envPath = path.resolve(process.cwd(), ".env");
const envText = fs.readFileSync(envPath, "utf8");
const match = envText.match(/^DATABASE_URL=(.*)$/m);
if (!match) throw new Error("DATABASE_URL not found in .env");
const databaseUrl = match[1].trim().replace(/^["']|["']$/g, "");

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/sql/add-temp-password-reminders.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
const { rows } = await client.query(`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'temp_password_reminders'
`);
console.log("OK:", JSON.stringify(rows, null, 2));
await client.end();
