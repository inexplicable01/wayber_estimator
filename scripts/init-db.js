// One-off setup script: creates the estimator_leads / estimator_lead_photos
// tables on the shared PythonAnywhere MySQL database, if they don't already
// exist. Safe to re-run — uses CREATE TABLE IF NOT EXISTS and never touches
// any other table in this database.
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.PA_DB_HOST,
    port: Number(process.env.PA_DB_PORT ?? 3306),
    user: process.env.PA_DB_USER,
    password: process.env.PA_DB_PASSWORD,
    database: process.env.PA_DB_NAME?.split("\\$").join("$"),
    ssl: { rejectUnauthorized: false },
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS estimator_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      address VARCHAR(500) NOT NULL,
      lat DOUBLE NULL,
      lng DOUBLE NULL,
      usps_confirmed TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'address_confirmed',
      estimate_low INT NULL,
      estimate_high INT NULL,
      condition_summary TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("estimator_leads ready");

  await conn.query(`
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
  console.log("estimator_lead_photos ready");

  const [tables] = await conn.query("SHOW TABLES LIKE 'estimator_%'");
  console.log("Confirmed tables:", tables.map((t) => Object.values(t)[0]));

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
