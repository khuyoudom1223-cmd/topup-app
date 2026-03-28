import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@topupgg.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const GAME_SLUG = process.env.PRODUCT_TEST_GAME || 'mobile-legends';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackImagePath = path.join(__dirname, '..', 'public', 'image', 'photo_2026-03-26_20-14-27.jpg');

async function safeJson(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { success: false, error: `Invalid JSON response: ${raw.slice(0, 300)}` };
  }
}

async function requireSuccess(response, context) {
  const data = await safeJson(response);
  if (!response.ok || !data?.success) {
    throw new Error(`${context} failed (${response.status}): ${data?.error || data?.message || 'Unknown error'}`);
  }
  return data;
}

async function login() {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'admin', username: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const data = await requireSuccess(response, 'Admin login');
  const token = data?.data?.token;
  if (!token) {
    throw new Error('Admin login returned no token');
  }

  return token;
}

async function buildCreateBody() {
  const now = Date.now();
  const productName = `Smoke Product ${now}`;

  try {
    const buffer = await fs.readFile(fallbackImagePath);
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const form = new FormData();
    form.append('gameSlug', GAME_SLUG);
    form.append('name', productName);
    form.append('amount', '777');
    form.append('price', '3.21');
    form.append('popular', 'true');
    form.append('image', blob, 'smoke-product.jpg');
    return { body: form, productName };
  } catch {
    const fallback = {
      gameSlug: GAME_SLUG,
      name: productName,
      amount: 777,
      price: 3.21,
      popular: true,
      imageSrc: '/image/photo_2026-03-26_20-14-27.jpg',
    };

    return {
      body: JSON.stringify(fallback),
      headers: { 'Content-Type': 'application/json' },
      productName,
    };
  }
}

async function run() {
  console.log('Checking product CRUD API...');

  const healthResponse = await fetch(`${API_BASE}/health`);
  if (!healthResponse.ok) {
    throw new Error(`API is not reachable at ${API_BASE}. Start server first.`);
  }

  const token = await login();
  const authHeader = { Authorization: `Bearer ${token}` };

  const { body, headers, productName } = await buildCreateBody();

  const createResponse = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: {
      ...authHeader,
      ...(headers || {}),
    },
    body,
  });
  const created = await requireSuccess(createResponse, 'Create product');
  const productId = created?.data?.id;
  const createdName = String(created?.data?.name || '').trim();
  const createdImageSrc = String(created?.data?.imageSrc || '').trim();
  if (!productId) {
    throw new Error('Create product returned no product id');
  }
  if (!createdName) {
    throw new Error('Create product returned empty product name');
  }
  if (!createdImageSrc) {
    throw new Error('Create product returned empty image path');
  }
  if (!/^https?:\/\//i.test(createdImageSrc) && !createdImageSrc.startsWith('/')) {
    throw new Error(`Create product returned invalid image path: ${createdImageSrc}`);
  }

  const updateBody = JSON.stringify({
    name: `${productName} Updated`,
    amount: 999,
    price: 5.67,
    popular: false,
  });

  const updateResponse = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json',
    },
    body: updateBody,
  });
  await requireSuccess(updateResponse, 'Update product');

  const listResponse = await fetch(`${API_BASE}/api/products?gameSlug=${encodeURIComponent(GAME_SLUG)}`);
  const listed = await requireSuccess(listResponse, 'Fetch products');
  const listedProduct = (listed?.data || []).find((p) => String(p.id) === String(productId));
  const existsAfterUpdate = Boolean(listedProduct);
  if (!existsAfterUpdate) {
    throw new Error('Updated product not found in list');
  }
  if (!String(listedProduct?.name || '').trim()) {
    throw new Error('Updated product has empty name in list response');
  }
  if (!String(listedProduct?.imageSrc || '').trim()) {
    throw new Error('Updated product has empty image path in list response');
  }

  const deleteResponse = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: authHeader,
  });
  await requireSuccess(deleteResponse, 'Delete product');

  const verifyDeleteResponse = await fetch(`${API_BASE}/api/products?gameSlug=${encodeURIComponent(GAME_SLUG)}`);
  const afterDelete = await requireSuccess(verifyDeleteResponse, 'Verify delete');
  const stillExists = (afterDelete?.data || []).some((p) => String(p.id) === String(productId));
  if (stillExists) {
    throw new Error('Product still exists after delete');
  }

  console.log('Product CRUD API check passed.');
}

run().catch((error) => {
  console.error(`Product CRUD API check failed: ${error.message}`);
  process.exit(1);
});
