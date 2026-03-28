import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('🔌 Connected to MySQL');

  // Seed Games
  const games = [
    { name: 'Mobile Legends', code: 'mobile-legends', image: '🎮', publisher: 'Moonton' },
    { name: 'Free Fire', code: 'free-fire', image: '🔥', publisher: 'Garena' },
    { name: 'PUBG Mobile', code: 'pubg-mobile', image: '🎯', publisher: 'Krafton' },
    { name: 'Valorant', code: 'valorant', image: '✨', publisher: 'Riot Games' },
  ];

  const [existingGames] = await conn.query('SELECT COUNT(*) as c FROM games');
  if (existingGames[0].c === 0) {
    for (const g of games) {
      await conn.query('INSERT INTO games (name, code, image, publisher, status) VALUES (?, ?, ?, ?, 1)', 
        [g.name, g.code, g.image, g.publisher]);
    }
    console.log('✅ Seeded games');
  } else {
    console.log('✅ Games already exist');
  }

  // Seed Products
  const [existingProds] = await conn.query('SELECT COUNT(*) as c FROM game_products');
  if (existingProds[0].c === 0) {
    const [dbGames] = await conn.query('SELECT id, code FROM games');
    
    for (const g of dbGames) {
      const prods = [
        { name: '100 Diamonds', amount: 100, price: 1.99 },
        { name: '310 Diamonds', amount: 310, price: 4.99 },
        { name: '520 Diamonds', amount: 520, price: 7.99 },
        { name: '1060 Diamonds', amount: 1060, price: 14.99 },
      ];
      
      for (const p of prods) {
        await conn.query('INSERT INTO game_products (game_id, product_name, diamond_amount, price, provider_price, status) VALUES (?, ?, ?, ?, ?, 1)',
          [g.id, p.name, p.amount, p.price, p.price * 0.8]);
      }
    }
    console.log('✅ Seeded game products');
  } else {
    console.log('✅ Products already exist');
  }

  await conn.end();
  console.log('🎉 Seeding complete!');
}

seed().catch(console.error);
