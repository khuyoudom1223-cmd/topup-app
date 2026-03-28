import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function seedAdmin() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Ensure users table exists 
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username varchar(100) UNIQUE,
      email varchar(150),
      password varchar(255),
      status tinyint(1) DEFAULT 1,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Clear existing to avoid duplicate conflicts for testing
  await conn.query('DELETE FROM admin_users WHERE email = "admin@topupgg.com"');
  await conn.query('DELETE FROM users WHERE username = "testuser"');

  await conn.query(`
    INSERT INTO admin_users (name, email, password, role)
    VALUES ('Super Admin', 'admin@topupgg.com', ?, 'super_admin')
  `, [adminPassword]);

  await conn.query(`
    INSERT INTO users (username, email, password)
    VALUES ('testuser', 'user@topupgg.com', ?)
  `, [userPassword]);

  console.log('✅ Secure Authentication Seeded!');
  console.log('   Admin: admin@topupgg.com / admin123');
  console.log('   User: testuser / user123');

  await conn.end();
}

seedAdmin().catch(console.error);
