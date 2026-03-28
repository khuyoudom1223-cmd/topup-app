import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const PROVIDER_NAME = process.env.PROVIDER_NAME || 'mock';
const PROVIDER_API_URL = process.env.PROVIDER_API_URL || '';
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY || '';
let hasEnsuredProductColumns = false;

async function ensureProductColumns() {
  if (hasEnsuredProductColumns) return;

  const [imageColumns] = await pool.query("SHOW COLUMNS FROM game_products LIKE 'image_path'");
  if (!imageColumns.length) {
    await pool.query('ALTER TABLE game_products ADD COLUMN image_path VARCHAR(255) NULL');
  }

  const [popularColumns] = await pool.query("SHOW COLUMNS FROM game_products LIKE 'popular'");
  if (!popularColumns.length) {
    await pool.query('ALTER TABLE game_products ADD COLUMN popular TINYINT(1) NOT NULL DEFAULT 0');
  }

  const [descriptionColumns] = await pool.query("SHOW COLUMNS FROM game_products LIKE 'description'");
  if (!descriptionColumns.length) {
    await pool.query('ALTER TABLE game_products ADD COLUMN description TEXT NULL');
  }

  hasEnsuredProductColumns = true;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PRODUCT_UPLOAD_DIR = path.join(PUBLIC_DIR, 'image', 'products');
const GAME_UPLOAD_DIR = path.join(PUBLIC_DIR, 'image', 'games');

// Ensure upload directories exist
[PRODUCT_UPLOAD_DIR, GAME_UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isGame = req.originalUrl.includes('/api/games');
    cb(null, isGame ? GAME_UPLOAD_DIR : PRODUCT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const productStreamClients = new Set();

function normalizePublicImagePath(rawPath) {
  const input = String(rawPath || '').trim();
  if (!input) return '';

  if (/^https?:\/\//i.test(input) || input.startsWith('data:')) {
    return input;
  }

  const normalized = input.replace(/\\/g, '/');
  if (normalized.startsWith('/public/')) {
    return normalized.replace(/^\/public\//, '/');
  }
  if (normalized.startsWith('public/')) {
    return `/${normalized.replace(/^public\//, '')}`;
  }
  if (normalized.startsWith('/')) {
    return normalized;
  }
  return `/${normalized}`;
}

function broadcastProductUpdate(payload) {
  const eventPayload = {
    ...payload,
    at: new Date().toISOString(),
  };
  const data = `data: ${JSON.stringify(eventPayload)}\n\n`;

  for (const client of productStreamClients) {
    try {
      if (client.gameSlug && payload.gameSlug && client.gameSlug !== payload.gameSlug) {
        continue;
      }
      client.res.write(data);
    } catch {
      productStreamClients.delete(client);
    }
  }
}

// Initialize System Settings Table
async function initSystemSettings() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        setting_group VARCHAR(50),
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const defaults = [
      ['wing_enabled', '1', 'payment', 'Wing Payment Gateway Status'],
      ['stripe_enabled', '1', 'payment', 'Stripe Payment Gateway Status'],
      ['aba_token', 'aba_tok_xxxx', 'api', 'ABA PayWay API Token'],
      ['smileone_key', 'sk_live_xxxx', 'api', 'SmileOne API Key'],
      ['unipin_id', 'UP-12345', 'api', 'UniPin Merchant ID'],
    ];

    for (const [key, val, group, desc] of defaults) {
      await pool.query(
        'INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_group, description) VALUES (?, ?, ?, ?)',
        [key, val, group, desc]
      );
    }
    console.log('System settings initialized.');
  } catch (err) {
    console.error('Failed to initialize system settings:', err.message);
  }
}
initSystemSettings();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(PUBLIC_DIR));

/* ============================================
   GET / and /health — Basic API status
   ============================================ */
app.get('/', (req, res) => {
  return res.json({
    success: true,
    service: 'topupgg-api',
    message: 'API is running',
    docs: ['/api/player/health', '/api/player?userId=12345&serverId=6789']
  });
});

app.get('/health', (req, res) => {
  return res.json({
    success: true,
    service: 'topupgg-api',
    status: 'ok'
  });
});

app.get('/api', (req, res) => {
  return res.json({
    success: true,
    service: 'topupgg-api',
    message: 'API base endpoint',
    endpoints: ['/api/player/health', '/api/player']
  });
});

/* ============================================
   Middleware: Verify JWT Token
   ============================================ */
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ success: false, error: 'No token provided' });

  jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

/* ============================================
   POST /api/login — Auth User or Admin
   ============================================ */
app.post('/api/login', async (req, res) => {
  try {
    const { type, username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    let user;
    if (type === 'admin') {
      const [admins] = await pool.query('SELECT * FROM admin_users WHERE email = ?', [username]);
      if (admins.length > 0) user = admins[0];
    } else {
      const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
      if (users.length > 0) user = users[0];
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.name || user.username, type, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.name || user.username, email: user.email, type, role: user.role || 'user' }
      }
    });
  } catch (err) {
    console.error('POST /api/login error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/* ============================================
   GET /api/games — List all active games
   ============================================ */
/* ============================================
   GET /api/games — List all active/all games
   ============================================ */
app.get('/api/games', async (req, res) => {
  try {
    const includeAll = req.query.admin === 'true';

    if (includeAll) {
      const token = req.headers['authorization'];
      if (!token) {
        return res.status(403).json({ success: false, error: 'No token provided' });
      }

      try {
        jwt.verify(String(token).replace('Bearer ', ''), JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }

    const statusQuery = includeAll ? '' : 'WHERE status = 1';
    
    const [rows] = await pool.query(
      `SELECT id, name, code AS slug, image AS icon, image AS banner, publisher, status, category
       FROM games ${statusQuery} ORDER BY id`
    );
    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        imageSrc: normalizePublicImagePath(row.imageSrc),
      })),
    });
  } catch (err) {
    console.error('GET /api/games error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch games' });
  }
});

/* ============================================
  POST /api/games — Create game (AUTHENTICATED)
  ============================================ */
app.post('/api/games', verifyToken, upload.single('icon'), async (req, res) => {
  try {
    const { name, slug, publisher, category } = req.body;
    const iconPath = req.file ? `/public/image/games/${req.file.filename}` : (req.body.iconUrl || '🎮');

    if (!name || !slug) return res.status(400).json({ success: false, error: 'Name and slug are required' });

    const [result] = await pool.query(
      'INSERT INTO games (name, code, image, publisher, category, status) VALUES (?, ?, ?, ?, ?, 1)',
      [name, slug, iconPath, publisher || '', category || 'Mobile Games']
    );

    res.status(201).json({ success: true, data: { id: result.insertId, name, slug, icon: iconPath } });
  } catch (err) {
    console.error('POST /api/games error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create game' });
  }
});

/* ============================================
  PUT /api/games/:id — Update game (AUTHENTICATED)
  ============================================ */
app.put('/api/games/:id', verifyToken, upload.single('icon'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, publisher, category, status } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM games WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Game not found' });

    let iconPath = existing[0].image;
    if (req.file) iconPath = `/public/image/games/${req.file.filename}`;

    await pool.query(
      'UPDATE games SET name = ?, code = ?, image = ?, publisher = ?, category = ?, status = ? WHERE id = ?',
      [name || existing[0].name, slug || existing[0].code, iconPath, publisher || existing[0].publisher, category || existing[0].category, status !== undefined ? status : existing[0].status, id]
    );

    res.json({ success: true, message: 'Updated successfully' });
  } catch (err) {
    console.error('PUT /api/games error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update game' });
  }
});

/* ============================================
  DELETE /api/games/:id — Delete game (AUTHENTICATED)
  ============================================ */
app.delete('/api/games/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Note: products have FK with games so they might need cascading if not set in DB
    await pool.query('DELETE FROM games WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/games error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete game' });
  }
});

/* ============================================
   GET /api/products/:gameSlug — Products for a game
   ============================================ */
app.get('/api/products', async (req, res) => {
  try {
    await ensureProductColumns();

    const gameSlug = String(req.query.gameSlug || '').trim();
    const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';
    const filters = [];
    const params = [];

    if (gameSlug) {
      filters.push('g.code = ?');
      params.push(gameSlug);
    }

    if (!includeInactive) {
      filters.push('p.status = 1');
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.id, p.product_name AS name, p.diamond_amount AS amount, 
              p.price, p.status, COALESCE(p.popular, 0) AS popular, COALESCE(p.image_path, '') AS imageSrc,
              COALESCE(p.description, '') AS description,
              g.code AS gameSlug
       FROM game_products p
       JOIN games g ON p.game_id = g.id
       ${whereClause}
       ORDER BY p.price ASC`,
      params
    );
    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        imageSrc: normalizePublicImagePath(row.imageSrc),
      })),
    });
  } catch (err) {
    console.error('GET /api/products error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

/* ============================================
   GET /api/products/stream — Product realtime updates (SSE)
   ============================================ */
app.get('/api/products/stream', (req, res) => {
  const gameSlug = String(req.query.gameSlug || '').trim() || null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { res, gameSlug };
  productStreamClients.add(client);

  res.write(`data: ${JSON.stringify({ type: 'connected', gameSlug, at: new Date().toISOString() })}\n\n`);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
      productStreamClients.delete(client);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    productStreamClients.delete(client);
  });
});

/* ============================================
   GET /api/products/:gameSlug — Products for a game (compat)
   ============================================ */
app.get('/api/products/:gameSlug', async (req, res) => {
  try {
    await ensureProductColumns();

    const [rows] = await pool.query(
      `SELECT p.id, p.product_name AS name, p.diamond_amount AS amount,
              p.price, p.status, COALESCE(p.popular, 0) AS popular, COALESCE(p.image_path, '') AS imageSrc,
              COALESCE(p.description, '') AS description,
              g.code AS gameSlug
       FROM game_products p
       JOIN games g ON p.game_id = g.id
       WHERE g.code = ? AND p.status = 1
       ORDER BY p.price ASC`,
      [req.params.gameSlug]
    );
    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        imageSrc: normalizePublicImagePath(row.imageSrc),
      })),
    });
  } catch (err) {
    console.error('GET /api/products/:gameSlug error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

/* ============================================
  POST /api/products — Create product (AUTHENTICATED)
  ============================================ */
app.post('/api/products', verifyToken, upload.single('image'), async (req, res) => {
  try {
    await ensureProductColumns();

    const requestBody = req.body || {};
    const { gameSlug, amount, price, popular } = requestBody;
    const rawName = requestBody.name ?? requestBody.productName ?? requestBody.product_name;
    const rawDescription = requestBody.description ?? requestBody.title;
    const imagePath = req.file
      ? `/image/products/${req.file.filename}`
      : normalizePublicImagePath(requestBody.imageSrc ?? requestBody.imagePath ?? requestBody.image_path ?? '');

    const normalizedGameSlug = String(gameSlug || '').trim();
    const normalizedName = String(rawName || '').trim();
    const normalizedDescription = String(rawDescription || '').trim();
    const normalizedAmount = Number(amount);
    const normalizedPrice = Number(price);
    const isPopular = popular === 'true' || popular === true ? 1 : 0;

    if (
      !normalizedGameSlug
      || !normalizedName
      || isNaN(normalizedAmount)
      || isNaN(normalizedPrice)
      || normalizedAmount <= 0
      || normalizedPrice < 0
    ) {
      return res.status(400).json({ success: false, error: 'Missing or invalid product fields' });
    }

    const [games] = await pool.query('SELECT id FROM games WHERE code = ? LIMIT 1', [normalizedGameSlug]);
    if (games.length === 0) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const gameId = games[0].id;
    const providerPrice = Number((normalizedPrice * 0.8).toFixed(2));

    const [insertResult] = await pool.query(
      `INSERT INTO game_products (game_id, product_name, diamond_amount, price, provider_price, status, image_path, popular, description)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [gameId, normalizedName, Math.round(normalizedAmount), normalizedPrice, providerPrice, imagePath, isPopular, normalizedDescription]
    );

    const [createdRows] = await pool.query(
      `SELECT id, product_name AS name, diamond_amount AS amount, price, status, popular,
              COALESCE(image_path, '') AS imageSrc, COALESCE(description, '') AS description
       FROM game_products WHERE id = ? LIMIT 1`,
      [insertResult.insertId]
    );

    broadcastProductUpdate({
      type: 'created',
      gameSlug: normalizedGameSlug,
      productId: insertResult.insertId,
    });

    return res.status(201).json({
      success: true,
      data: {
        ...createdRows[0],
        imageSrc: normalizePublicImagePath(createdRows[0]?.imageSrc),
      },
    });
  } catch (err) {
    console.error('POST /api/products error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

/* ============================================
  PUT /api/products/:id — Update product (AUTHENTICATED)
  ============================================ */
app.put('/api/products/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    await ensureProductColumns();

    const { id } = req.params;
    const requestBody = req.body || {};
    const {
      name,
      productName,
      product_name: productNameSnake,
      amount,
      price,
      popular,
      description,
      title,
    } = requestBody;
    
    // Check if product exists
    const [existing] = await pool.query('SELECT * FROM game_products WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });

    const [gameRows] = await pool.query('SELECT code FROM games WHERE id = ? LIMIT 1', [existing[0].game_id]);
    const productGameSlug = gameRows[0]?.code || null;

    let imagePath = normalizePublicImagePath(existing[0].image_path);
    if (req.file) {
      imagePath = `/image/products/${req.file.filename}`;
    } else if (
      requestBody.imageSrc !== undefined
      || requestBody.imagePath !== undefined
      || requestBody.image_path !== undefined
    ) {
      imagePath = normalizePublicImagePath(
        requestBody.imageSrc ?? requestBody.imagePath ?? requestBody.image_path ?? ''
      );
    }

    const rawName = name ?? productName ?? productNameSnake;
    const rawDescription = description ?? title;
    const normalizedName = rawName !== undefined ? String(rawName).trim() : existing[0].product_name;
    const normalizedDescription = rawDescription !== undefined ? String(rawDescription).trim() : (existing[0].description || '');
    const normalizedAmount = amount !== undefined ? Number(amount) : existing[0].diamond_amount;
    const normalizedPrice = price !== undefined ? Number(price) : existing[0].price;
    const isPopular = popular !== undefined ? (popular === 'true' || popular === true ? 1 : 0) : existing[0].popular;

    if (!normalizedName || isNaN(normalizedAmount) || isNaN(normalizedPrice) || normalizedAmount <= 0 || normalizedPrice < 0) {
      return res.status(400).json({ success: false, error: 'Missing or invalid product fields' });
    }

    const providerPrice = Number((normalizedPrice * 0.8).toFixed(2));

    await pool.query(
      `UPDATE game_products SET product_name = ?, diamond_amount = ?, price = ?, provider_price = ?, image_path = ?, popular = ?, description = ?
       WHERE id = ?`,
      [normalizedName, Math.round(normalizedAmount), normalizedPrice, providerPrice, imagePath, isPopular, normalizedDescription, id]
    );

    const [updatedRows] = await pool.query(
      `SELECT id, product_name AS name, diamond_amount AS amount, price, status, popular,
              COALESCE(image_path, '') AS imageSrc, COALESCE(description, '') AS description
       FROM game_products WHERE id = ? LIMIT 1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...updatedRows[0],
        imageSrc: normalizePublicImagePath(updatedRows[0]?.imageSrc),
      },
    });

    broadcastProductUpdate({
      type: 'updated',
      gameSlug: productGameSlug,
      productId: id,
    });
  } catch (err) {
    console.error('PUT /api/products error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

/* ============================================
  DELETE /api/products/:id — Delete product (AUTHENTICATED)
  ============================================ */
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    await ensureProductColumns();

    const { id } = req.params;
    const [targetRows] = await pool.query(
      `SELECT p.id, g.code AS gameSlug
       FROM game_products p
       JOIN games g ON p.game_id = g.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const [result] = await pool.query('DELETE FROM game_products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });

    broadcastProductUpdate({
      type: 'deleted',
      gameSlug: targetRows[0].gameSlug,
      productId: id,
    });
  } catch (err) {
    console.error('DELETE /api/products error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

/* ============================================
   GET /api/check-player — Verify player ID
   ============================================ */
const mockPlayerNames = ['EVOS•Luminaire', 'RRQ•Lemon', 'ONIC•Kairi', 'BTR•Branz', 'TNC•DLAR'];

const allowedPaymentMethods = new Set(['aba', 'wing', 'truemoney']);

function getMockUsername(userId) {
  const index = parseInt(userId, 10) % mockPlayerNames.length || 0;
  return mockPlayerNames[Math.abs(index)];
}

function isProviderConfigured() {
  return Boolean(PROVIDER_API_URL && PROVIDER_API_KEY);
}

async function callProvider(endpoint, payload) {
  const url = `${PROVIDER_API_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDER_API_KEY}`,
      'X-Provider': PROVIDER_NAME,
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || `Provider request failed: ${res.status}`);
  }

  return data;
}

async function validatePlayerWithProvider(userId, serverId) {
  if (!isProviderConfigured()) {
    return {
      username: getMockUsername(userId),
      source: 'mock',
    };
  }

  const data = await callProvider('/validate-player', {
    userId,
    serverId,
  });

  const username = data?.username || data?.nickname || data?.data?.username || data?.data?.nickname;

  if (!username) {
    throw new Error('Player not found or invalid input');
  }

  return {
    username,
    source: PROVIDER_NAME,
  };
}

async function processTopUpWithProvider({ userId, serverId, productId, paymentMethod, orderId }) {
  if (!isProviderConfigured()) {
    return {
      status: 'pending',
      providerTxnId: `MOCK-${Date.now()}`,
      source: 'mock',
    };
  }

  const data = await callProvider('/topup', {
    userId,
    serverId,
    productId,
    paymentMethod,
    referenceId: orderId,
  });

  const normalizedStatus = String(data?.status || '').toLowerCase();
  const status = ['pending', 'processing', 'success', 'failed'].includes(normalizedStatus)
    ? normalizedStatus
    : 'pending';

  return {
    status,
    providerTxnId: data?.transactionId || data?.providerTxnId || `PROVIDER-${Date.now()}`,
    source: PROVIDER_NAME,
  };
}

function isValidPlayerInput(userId, serverId) {
  const userIdStr = String(userId || '').trim();
  const serverIdStr = String(serverId || '').trim();
  const idPattern = /^\d+$/;

  return (
    userIdStr.length >= 5 &&
    serverIdStr.length >= 4 &&
    idPattern.test(userIdStr) &&
    idPattern.test(serverIdStr)
  );
}

/* ============================================
   GET /api/player/health — Player API identity/health
   ============================================ */
app.get('/api/player/health', (req, res) => {
  return res.json({
    success: true,
    service: 'player-api',
    version: 1
  });
});

/* ============================================
   GET/POST /api/player — Strict player lookup contract
   ============================================ */
app.get('/api/player', async (req, res) => {
  try {
    const { userId, serverId } = req.query;

    if (!isValidPlayerInput(userId, serverId)) {
      return res.status(400).json({
        success: false,
        message: 'Player not found or invalid input'
      });
    }

    const validated = await validatePlayerWithProvider(userId, serverId);
    const username = validated.username;
    if (!username) {
      return res.status(404).json({
        success: false,
        message: 'Player not found or invalid input'
      });
    }

    return res.json({
      success: true,
      username
    });
  } catch (err) {
    console.error('GET /api/player error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Player not found or invalid input'
    });
  }
});

app.post('/api/player', async (req, res) => {
  try {
    const { userId, serverId } = req.body || {};

    if (!isValidPlayerInput(userId, serverId)) {
      return res.status(400).json({
        success: false,
        message: 'Player not found or invalid input'
      });
    }

    const validated = await validatePlayerWithProvider(userId, serverId);
    const username = validated.username;
    if (!username) {
      return res.status(404).json({
        success: false,
        message: 'Player not found or invalid input'
      });
    }

    return res.json({
      success: true,
      username
    });
  } catch (err) {
    console.error('POST /api/player error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Player not found or invalid input'
    });
  }
});

app.get('/api/check-player', async (req, res) => {
  try {
    const { userId, zoneId } = req.query;

    if (!userId || userId.length < 3) {
      return res.status(400).json({ success: false, error: 'Invalid User ID. Please enter a valid ID.' });
    }

    const index = parseInt(userId, 10) % mockPlayerNames.length || 0;

    res.json({
      success: true,
      data: {
        userId,
        zoneId: zoneId || '',
        nickname: mockPlayerNames[Math.abs(index)],
        level: Math.floor(Math.random() * 80) + 20,
      }
    });
  } catch (err) {
    console.error('GET /api/check-player error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to check player' });
  }
});

/* ============================================
   POST /api/create-order — Create a new order
   ============================================ */
app.post('/api/create-order', async (req, res) => {
  try {
    const { game, userId, zoneId, productId, paymentMethod, accountId } = req.body;

    if (!game || !userId || !productId || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (!allowedPaymentMethods.has(String(paymentMethod).toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    // Get game ID
    const [games] = await pool.query('SELECT id FROM games WHERE code = ?', [game]);
    if (games.length === 0) return res.status(400).json({ success: false, error: 'Game not found' });
    const gameId = games[0].id;

    // Get product price
    const [products] = await pool.query('SELECT price FROM game_products WHERE id = ?', [productId]);
    const price = products.length > 0 ? products[0].price : 0;

    const orderId = 'TUG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const providerResult = await processTopUpWithProvider({
      userId,
      serverId: zoneId || '',
      productId,
      paymentMethod,
      orderId,
    });

    await pool.query(
      `INSERT INTO orders (order_number, game_id, product_id, player_id, zone_id, price, status, account_id)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [orderId, gameId, productId, userId, zoneId || '', price, accountId || null]
    );

    if (providerResult.status !== 'pending') {
      await pool.query('UPDATE orders SET status = ? WHERE order_number = ?', [providerResult.status, orderId]);
    }

    // Simulate status progression
    if (providerResult.status === 'pending') {
      setTimeout(async () => {
        try { await pool.query("UPDATE orders SET status = 'processing' WHERE order_number = ?", [orderId]); } catch (e) { /* ignore */ }
      }, 3000);

      setTimeout(async () => {
        try {
          const newStatus = Math.random() > 0.1 ? 'success' : 'failed';
          await pool.query("UPDATE orders SET status = ? WHERE order_number = ?", [newStatus, orderId]);
        } catch (e) { /* ignore */ }
      }, 7000);
    }

    const [created] = await pool.query('SELECT * FROM orders WHERE order_number = ?', [orderId]);

    // Map response back to frontend field names
    res.json({ 
      success: true, 
      data: {
        order_id: created[0].order_number,
        game_slug: game,
        player_id: created[0].player_id,
        zone_id: created[0].zone_id,
        product_id: created[0].product_id,
        payment_method: paymentMethod, 
        status: created[0].status,
        created_at: created[0].created_at
      } 
    });
  } catch (err) {
    console.error('POST /api/create-order error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

/* ============================================
   GET /api/user/orders — Get logged in user's orders
   ============================================ */
app.get('/api/user/orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ success: false, error: 'Invalid user' });

    const [rows] = await pool.query(
      `SELECT o.*, g.code AS game_slug, g.name AS game_name, p.product_name, p.price AS product_price
       FROM orders o
       LEFT JOIN games g ON o.game_id = g.id
       LEFT JOIN game_products p ON o.product_id = p.id
       WHERE o.account_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const mapped = rows.map(order => ({
      order_id: order.order_number,
      game_slug: order.game_slug,
      game_name: order.game_name,
      player_id: order.player_id,
      zone_id: order.zone_id,
      product_id: order.product_id,
      status: order.status,
      amount: order.price || order.product_price,
      product_name: order.product_name,
      created_at: order.created_at
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('GET /api/user/orders error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch user orders' });
  }
});

/* ============================================
   GET /api/order-status/:orderId — Get order status
   ============================================ */
app.get('/api/order-status/:orderId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, g.code AS game_slug, g.name AS game_name, p.product_name, p.diamond_amount AS product_amount
       FROM orders o
       LEFT JOIN games g ON o.game_id = g.id
       LEFT JOIN game_products p ON o.product_id = p.id
       WHERE o.order_number = ?`,
      [req.params.orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = rows[0];
    res.json({ 
      success: true, 
      data: {
        order_id: order.order_number,
        game_slug: order.game_slug,
        game_name: order.game_name,
        player_id: order.player_id,
        zone_id: order.zone_id,
        product_id: order.product_id,
        payment_method: order.payment_method || 'N/A',
        status: order.status,
        amount: order.price,
        product_name: order.product_name,
        created_at: order.created_at,
        updated_at: order.updated_at || order.created_at
      }
    });
  } catch (err) {
    console.error('GET /api/order-status error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch order status' });
  }
});

/* ============================================
   GET /api/orders — List all orders (PROTECTED ADMIN)
   ============================================ */
app.get('/api/orders', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, g.code AS game_slug, g.name AS game_name, p.product_name, p.price AS product_price
       FROM orders o
       LEFT JOIN games g ON o.game_id = g.id
       LEFT JOIN game_products p ON o.product_id = p.id
       ORDER BY o.created_at DESC`
    );
    
    const mapped = rows.map(order => ({
      order_id: order.order_number,
      game_slug: order.game_slug,
      game_name: order.game_name,
      player_id: order.player_id,
      zone_id: order.zone_id,
      product_id: order.product_id,
      payment_method: order.payment_method || 'N/A',
      status: order.status,
      amount: order.price || order.product_price,
      product_name: order.product_name,
      created_at: order.created_at,
      updated_at: order.updated_at || order.created_at
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('GET /api/orders error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

/* ============================================
   PUT /api/orders/:orderId/status — Update order status (PROTECTED ADMIN)
   ============================================ */
app.put('/api/orders/:orderId/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'success', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    await pool.query('UPDATE orders SET status = ? WHERE order_number = ?', [status, req.params.orderId]);
    
    res.json({ success: true, message: 'Updated successfully' });
  } catch (err) {
    console.error('PUT /api/orders/:orderId/status error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

/* ============================================
   GET /api/admin/settings — Fetch all system settings (PROTECTED ADMIN)
   ============================================ */
app.get('/api/admin/settings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('GET /api/admin/settings error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/* ============================================
   POST /api/admin/settings — Update multiple settings (PROTECTED ADMIN)
   ============================================ */
app.post('/api/admin/settings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
        [String(value), key]
      );
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('POST /api/admin/settings error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

/* ============================================
   Fallback: JSON 404 for unknown routes
   ============================================ */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    hint: 'Try /api/player/health or /api/player?userId=12345&serverId=6789'
  });
});

/* ============================================
   Start Server
   ============================================ */
const server = app.listen(PORT, () => {
  console.log(`\n🚀 TopUpGG API Server running on http://localhost:${PORT}`); 
  console.log(`   Connected to Database: ${process.env.DB_NAME}`);
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
