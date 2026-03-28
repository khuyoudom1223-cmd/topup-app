import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function seedDiamondPromo() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Ensure game exists
  const [existingGames] = await conn.query('SELECT id FROM games WHERE code = "diamond-promo"');
  let gameId;
  
  if (existingGames.length === 0) {
    const [result] = await conn.query('INSERT INTO games (name, code, image, publisher, status, category) VALUES (?, ?, ?, ?, 1, ?)', 
      ['Special Diamond Promo', 'diamond-promo', '💎', 'TopUpGG', 'Vouchers']);
    gameId = result.insertId;
    console.log('✅ Seeded Special Diamond Promo game');
  } else {
    gameId = existingGames[0].id;
  }

  // Clear existing products for this promo just in case
  await conn.query('DELETE FROM game_products WHERE game_id = ?', [gameId]);

  const prods = [
    { name: '11 Diamonds', amount: 11, price: 0.99 },
    { name: '22 Diamonds', amount: 22, price: 1.99 },
    { name: '55 Diamonds', amount: 55, price: 4.99 },
    { name: '150 Diamonds', amount: 150, price: 12.99 },
    { name: '250 Diamonds', amount: 250, price: 19.99 },
    { name: '500 Diamonds', amount: 500, price: 39.99 },
  ];
  
  for (const p of prods) {
    await conn.query('INSERT INTO game_products (game_id, product_name, diamond_amount, price, provider_price, status) VALUES (?, ?, ?, ?, ?, 1)',
      [gameId, p.name, p.amount, p.price, p.price * 0.8]);
  }
  
  console.log('✅ Seeded all exact diamond packages for promo');
  await conn.end();
}

seedDiamondPromo().catch(console.error);
