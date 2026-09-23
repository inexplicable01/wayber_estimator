import mysql from "mysql2/promise";

// Same PythonAnywhere MySQL database wayber_erp connects to directly
// (see wayber_erp/lib/prisma.ts for the reference connection pattern).
// This app only owns the estimator_leads / estimator_lead_photos tables —
// it never touches the CRM tables that live in the same database.
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    // PA_DB_NAME is stored in .env as "FatPanda1985\$housingdata" — the
    // backslash is a literal escape character in the .env value (Prisma's
    // connection-string parser strips it silently; mysql2's plain config
    // object does not, so it must be stripped here or every query 403s).
    const database = process.env.PA_DB_NAME?.split("\\$").join("$");

    pool = mysql.createPool({
      host: process.env.PA_DB_HOST,
      port: Number(process.env.PA_DB_PORT ?? 3306),
      user: process.env.PA_DB_USER,
      password: process.env.PA_DB_PASSWORD,
      database,
      ssl: { rejectUnauthorized: false },
      connectionLimit: 3,
      connectTimeout: 30_000,
    });
  }
  return pool;
}

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await getPool().query(sql, params);
  return rows as T;
}

export async function ensureLeadTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS estimator_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      address VARCHAR(500) NOT NULL,
      lat DOUBLE NULL,
      lng DOUBLE NULL,
      bedrooms INT NULL,
      bathrooms DECIMAL(3,1) NULL,
      sqft INT NULL,
      usps_confirmed TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'address_confirmed',
      estimate_low INT NULL,
      estimate_high INT NULL,
      condition_summary TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS estimator_lead_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id INT NOT NULL,
      step_label VARCHAR(100) NOT NULL,
      observation TEXT NOT NULL,
      value_impact VARCHAR(10) NOT NULL DEFAULT 'neutral',
      photo_data_url LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (lead_id),
      CONSTRAINT fk_estimator_lead_photos_lead
        FOREIGN KEY (lead_id) REFERENCES estimator_leads(id) ON DELETE CASCADE
    )
  `);
}
