/**
 * Database Setup Script
 * Creates the database, tables, and seeds initial data.
 * Run: node server/setup-db.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'oudom-top-up';

async function setup() {
  // Connect without database first to create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('🔌 Connected to MySQL');

  // Create database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.query(`USE \`${DB_NAME}\``);
  console.log(`📦 Database "${DB_NAME}" ready`);

  // Create tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS games (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      icon VARCHAR(10) DEFAULT '🎮',
      banner VARCHAR(255) DEFAULT '',
      accent_color VARCHAR(20) DEFAULT '#8b5cf6',
      currency VARCHAR(50) NOT NULL,
      requires_zone_id TINYINT(1) DEFAULT 0,
      publisher VARCHAR(100) DEFAULT '',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table "games" created');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      game_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      amount INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      popular TINYINT(1) DEFAULT 0,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table "products" created');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(50) NOT NULL UNIQUE,
      game_slug VARCHAR(100) NOT NULL,
      player_id VARCHAR(100) NOT NULL,
      zone_id VARCHAR(50) DEFAULT '',
      product_id VARCHAR(50) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      status ENUM('pending', 'processing', 'success', 'failed') DEFAULT 'pending',
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      player_nickname VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table "orders" created');

  // Seed games
  const gamesData = [
    ['Mobile Legends', 'mobile-legends', '⚔️', 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)', '#e94560', 'Diamonds', 1, 'Moonton'],
    ['Free Fire', 'free-fire', '🔥', 'linear-gradient(135deg, #0d1b2a, #1b2838, #2d4059)', '#ff6b35', 'Diamonds', 0, 'Garena'],
    ['PUBG Mobile', 'pubg-mobile', '🎯', 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #4a4a2e)', '#f5c518', 'UC', 0, 'Krafton'],
    ['Valorant', 'valorant', '🎮', 'linear-gradient(135deg, #0f1923, #1a2332, #ff4655)', '#ff4655', 'VP', 0, 'Riot Games'],
    ['Genshin Impact', 'genshin-impact', '✨', 'linear-gradient(135deg, #1a1a2e, #2d1b69, #5b21b6)', '#a78bfa', 'Genesis Crystals', 0, 'HoYoverse'],
    ['Call of Duty Mobile', 'cod-mobile', '💥', 'linear-gradient(135deg, #1a1a1a, #2d1f0e, #4a3520)', '#f97316', 'CP', 0, 'Activision'],
    ['Honkai Star Rail', 'honkai-star-rail', '🌟', 'linear-gradient(135deg, #0c0a1d, #1e1b4b, #312e81)', '#818cf8', 'Oneiric Shards', 0, 'HoYoverse'],
    ['League of Legends', 'league-of-legends', '🏆', 'linear-gradient(135deg, #091428, #0a1428, #0a3d62)', '#c8aa6e', 'RP', 0, 'Riot Games'],
  ];

  // Check if games already exist
  const [existing] = await conn.query('SELECT COUNT(*) as count FROM games');
  if (existing[0].count === 0) {
    for (const g of gamesData) {
      await conn.query(
        'INSERT INTO games (name, slug, icon, banner, accent_color, currency, requires_zone_id, publisher) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        g
      );
    }
    console.log(`🎮 Seeded ${gamesData.length} games`);
  } else {
    console.log(`🎮 Games already seeded (${existing[0].count} found)`);
  }

  // Get game IDs
  const [gameRows] = await conn.query('SELECT id, slug FROM games');
  const gameMap = {};
  gameRows.forEach(g => { gameMap[g.slug] = g.id; });

  // Seed products
  const [existingProducts] = await conn.query('SELECT COUNT(*) as count FROM products');
  if (existingProducts[0].count === 0) {
    const productsData = {
      'mobile-legends': [
        ['ml_86', '86 Diamonds', 86, 1.99, 0],
        ['ml_172', '172 Diamonds', 172, 3.99, 0],
        ['ml_257', '257 Diamonds', 257, 5.99, 1],
        ['ml_344', '344 Diamonds', 344, 7.99, 0],
        ['ml_429', '429 Diamonds', 429, 9.99, 0],
        ['ml_514', '514 Diamonds', 514, 11.99, 0],
        ['ml_706', '706 Diamonds', 706, 15.99, 1],
        ['ml_878', '878 Diamonds', 878, 19.99, 0],
        ['ml_2195', '2195 Diamonds', 2195, 49.99, 0],
        ['ml_4390', '4390 Diamonds', 4390, 99.99, 1],
      ],
      'free-fire': [
        ['ff_100', '100 Diamonds', 100, 1.99, 0],
        ['ff_310', '310 Diamonds', 310, 4.99, 0],
        ['ff_520', '520 Diamonds', 520, 7.99, 1],
        ['ff_1060', '1060 Diamonds', 1060, 14.99, 0],
        ['ff_2180', '2180 Diamonds', 2180, 29.99, 1],
        ['ff_5600', '5600 Diamonds', 5600, 74.99, 0],
      ],
      'pubg-mobile': [
        ['pubg_60', '60 UC', 60, 0.99, 0],
        ['pubg_325', '325 UC', 325, 4.99, 0],
        ['pubg_660', '660 UC', 660, 9.99, 1],
        ['pubg_1800', '1800 UC', 1800, 24.99, 0],
        ['pubg_3850', '3850 UC', 3850, 49.99, 1],
        ['pubg_8100', '8100 UC', 8100, 99.99, 0],
      ],
      'valorant': [
        ['val_475', '475 VP', 475, 4.99, 0],
        ['val_1000', '1000 VP', 1000, 9.99, 1],
        ['val_2050', '2050 VP', 2050, 19.99, 0],
        ['val_3650', '3650 VP', 3650, 34.99, 1],
        ['val_5350', '5350 VP', 5350, 49.99, 0],
        ['val_11000', '11000 VP', 11000, 99.99, 0],
      ],
      'genshin-impact': [
        ['gi_60', '60 Genesis Crystals', 60, 0.99, 0],
        ['gi_330', '330 Genesis Crystals', 330, 4.99, 0],
        ['gi_1090', '1090 Genesis Crystals', 1090, 14.99, 1],
        ['gi_2240', '2240 Genesis Crystals', 2240, 29.99, 0],
        ['gi_3880', '3880 Genesis Crystals', 3880, 49.99, 1],
        ['gi_8080', '8080 Genesis Crystals', 8080, 99.99, 0],
      ],
      'cod-mobile': [
        ['cod_80', '80 CP', 80, 0.99, 0],
        ['cod_420', '420 CP', 420, 4.99, 0],
        ['cod_880', '880 CP', 880, 9.99, 1],
        ['cod_1800', '1800 CP', 1800, 19.99, 0],
        ['cod_5000', '5000 CP', 5000, 49.99, 1],
        ['cod_10800', '10800 CP', 10800, 99.99, 0],
      ],
      'honkai-star-rail': [
        ['hsr_60', '60 Oneiric Shards', 60, 0.99, 0],
        ['hsr_330', '330 Oneiric Shards', 330, 4.99, 0],
        ['hsr_1090', '1090 Oneiric Shards', 1090, 14.99, 1],
        ['hsr_2240', '2240 Oneiric Shards', 2240, 29.99, 0],
        ['hsr_3880', '3880 Oneiric Shards', 3880, 49.99, 1],
        ['hsr_8080', '8080 Oneiric Shards', 8080, 99.99, 0],
      ],
      'league-of-legends': [
        ['lol_650', '650 RP', 650, 4.99, 0],
        ['lol_1380', '1380 RP', 1380, 9.99, 1],
        ['lol_2800', '2800 RP', 2800, 19.99, 0],
        ['lol_5000', '5000 RP', 5000, 34.99, 1],
        ['lol_7200', '7200 RP', 7200, 49.99, 0],
        ['lol_15000', '15000 RP', 15000, 99.99, 0],
      ],
    };

    let totalProducts = 0;
    for (const [slug, prods] of Object.entries(productsData)) {
      const gameId = gameMap[slug];
      if (!gameId) continue;
      for (const [id, name, amount, price, popular] of prods) {
        await conn.query(
          'INSERT INTO products (id, game_id, name, amount, price, popular) VALUES (?, ?, ?, ?, ?, ?)',
          [id, gameId, name, amount, price, popular]
        );
        totalProducts++;
      }
    }
    console.log(`💎 Seeded ${totalProducts} products`);
  } else {
    console.log(`💎 Products already seeded (${existingProducts[0].count} found)`);
  }

  await conn.end();
  console.log('\n🎉 Database setup complete!');
  console.log(`   Database: ${DB_NAME}`);
  console.log('   Tables: games, products, orders');
  console.log('   Ready to use.\n');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
