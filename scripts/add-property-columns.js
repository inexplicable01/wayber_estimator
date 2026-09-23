// One-off migration: adds bedrooms/bathrooms/sqft columns to estimator_leads.
// MySQL 5.7 (this database) doesn't support ADD COLUMN IF NOT EXISTS, so we
// catch ER_DUP_FIELDNAME to stay idempotent on re-run.
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const mysql = require("mysql2/promise");

async function addColumnIfMissing(conn, sql) {
  try {
    await conn.query(sql);
    console.log("OK:", sql);
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Already exists, skipping:", sql);
    } else {
      throw err;
    }
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.PA_DB_HOST,
    port: Number(process.env.PA_DB_PORT ?? 3306),
    user: process.env.PA_DB_USER,
    password: process.env.PA_DB_PASSWORD,
    database: process.env.PA_DB_NAME.split("\\$").join("$"),
    ssl: { rejectUnauthorized: false },
  });

  await addColumnIfMissing(conn, "ALTER TABLE estimator_leads ADD COLUMN bedrooms INT NULL AFTER lng");
  await addColumnIfMissing(conn, "ALTER TABLE estimator_leads ADD COLUMN bathrooms INT NULL AFTER bedrooms");
  await addColumnIfMissing(conn, "ALTER TABLE estimator_leads ADD COLUMN sqft INT NULL AFTER bathrooms");

  const [cols] = await conn.query("SHOW COLUMNS FROM estimator_leads");
  console.log("Columns now:", cols.map((c) => c.Field));

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
