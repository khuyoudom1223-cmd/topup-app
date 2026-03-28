import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const tables = ['games', 'game_products', 'orders', 'api_providers'];
  for (const t of tables) {
    try {
      const [res] = await conn.query(`SHOW CREATE TABLE ${t}`);
      console.log(`\n--- ${t} ---\n`, res[0]['Create Table']);
      
      const [rows] = await conn.query(`SELECT * FROM ${t} LIMIT 1`);
      console.log('Sample Data:', rows);
    } catch (e) {
      console.log('Error reading', t, e.message);
    }
  }

  await conn.end();
}

checkSchema().catch(console.error);
