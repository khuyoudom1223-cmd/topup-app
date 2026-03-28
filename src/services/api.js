/* API Service — connects to Express backend */

const API_BASE = '/api';

export async function checkPlayerHealth() {
  const res = await fetch(`${API_BASE}/player/health`);
  const data = await res.json();

  if (!res.ok || !data?.success || data?.service !== 'player-api') {
    throw new Error('Player API health check failed');
  }

  return data;
}

/**
 * Get Auth Headers for protected routes
 */
function getAuthHeaders() {
  const token = localStorage.getItem('topupgg_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Login user or admin
 */
export async function loginUser(type, username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, username, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Login failed');
  return data.data; // { token, user }
}

/**
 * Check player ID — returns player nickname
 */
export async function checkPlayer(gameSlug, userId, zoneId = '') {
  // Prefer strict backend contract: { success: true, username: string }
  try {
    const strictParams = new URLSearchParams({ userId, serverId: zoneId });
    const strictRes = await fetch(`${API_BASE}/player?${strictParams}`);
    const strictData = await strictRes.json();

    if (!strictRes.ok || !strictData?.success || !strictData?.username) {
      throw new Error(strictData?.message || 'Failed to check player');
    }

    // Normalize strict response to existing frontend shape.
    return {
      success: true,
      data: {
        userId,
        zoneId,
        nickname: strictData.username,
      }
    };
  } catch {
    // Fallback to legacy endpoint for backward compatibility.
    const params = new URLSearchParams({ game: gameSlug, userId, zoneId });
    const res = await fetch(`${API_BASE}/check-player?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to check player');
    return data;
  }
}

/**
 * Create an order
 */
export async function createOrder({ game, userId, zoneId, productId, paymentMethod, playerNickname }) {
  const accountUser = JSON.parse(localStorage.getItem('topupgg_user') || '{}');
  
  const res = await fetch(`${API_BASE}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      game, 
      userId, 
      zoneId, 
      productId, 
      paymentMethod, 
      playerNickname,
      accountId: accountUser?.id || null 
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create order');
  const order = data.data;
  return {
    success: true,
    data: {
      orderId: order.order_id,
      game: order.game_slug,
      userId: order.player_id,
      zoneId: order.zone_id,
      productId: order.product_id,
      paymentMethod: order.payment_method,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }
  };
}

/**
 * Get user order history (PROTECTED)
 */
export async function getUserOrders() {
  const res = await fetch(`${API_BASE}/user/orders`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch user orders');
  return {
    success: true,
    data: data.data.map(order => ({
      orderId: order.order_id,
      gameSlug: order.game_slug,
      gameName: order.game_name,
      playerId: order.player_id,
      zoneId: order.zone_id,
      productId: order.product_id,
      status: order.status,
      amount: order.amount,
      productName: order.product_name,
      createdAt: order.created_at
    }))
  };
}

/**
 * Get order status
 */
export async function getOrderStatus(orderId) {
  const res = await fetch(`${API_BASE}/order-status/${encodeURIComponent(orderId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Order not found');
  const order = data.data;
  return {
    success: true,
    data: {
      orderId: order.order_id,
      game: order.game_slug,
      gameName: order.game_name,
      userId: order.player_id,
      zoneId: order.zone_id,
      productId: order.product_id,
      paymentMethod: order.payment_method,
      status: order.status,
      amount: order.amount,
      productName: order.product_name,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }
  };
}

/**
 * Get all orders (for admin) - PROTECTED
 */
export async function getAllOrders() {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch orders');
  return {
    success: true,
    data: data.data.map(order => ({
      orderId: order.order_id,
      game: order.game_slug,
      gameName: order.game_name,
      userId: order.player_id,
      zoneId: order.zone_id,
      productId: order.product_id,
      paymentMethod: order.payment_method,
      status: order.status,
      amount: order.amount || order.product_price,
      productName: order.product_name,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }))
  };
}

/**
 * Update order status (admin) - PROTECTED
 */
export async function updateOrderStatus(orderId, newStatus) {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update order');
  return data;
}

/**
 * Fetch games from database
 */
export async function fetchGames(admin = false) {
  const res = await fetch(`${API_BASE}/games?admin=${admin}`, {
    headers: admin ? getAuthHeaders() : undefined,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch games');
  return data.data;
}

/**
 * Create game (authenticated) - PROTECTED
 */
export async function createGame(formData) {
  const token = localStorage.getItem('topupgg_token');
  const res = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create game');
  return data;
}

/**
 * Update game (authenticated) - PROTECTED
 */
export async function updateGame(id, formData) {
  const token = localStorage.getItem('topupgg_token');
  const res = await fetch(`${API_BASE}/games/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update game');
  return data;
}

/**
 * Delete game (authenticated) - PROTECTED
 */
export async function deleteGame(id) {
  const res = await fetch(`${API_BASE}/games/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete game');
  return data;
}

/**
 * Fetch all system settings (admin) - PROTECTED
 */
export async function fetchSystemSettings() {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch settings');
  return data.data;
}

/**
 * Update system settings (admin) - PROTECTED
 */
export async function updateSystemSettings(settings) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update settings');
  return data;
}

/**
 * Fetch products for a game from database
 */
export async function fetchProducts(gameSlug) {
  const params = new URLSearchParams();
  if (gameSlug) params.set('gameSlug', gameSlug);
  const query = params.toString();
  const res = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch products');
  return data.data;
}

/**
 * Create product (authenticated) - PROTECTED
 */
export async function createProduct(formData) {
  const token = localStorage.getItem('topupgg_token');
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create product');
  return data;
}

/**
 * Update product (authenticated) - PROTECTED
 */
export async function updateProduct(id, formData) {
  const token = localStorage.getItem('topupgg_token');
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update product');
  return data;
}

/**
 * Delete product (authenticated) - PROTECTED
 */
export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete product');
  return data;
}

/**
 * Subscribe to realtime product updates using Server-Sent Events.
 */
export function subscribeProductUpdates(onUpdate, options = {}) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const params = new URLSearchParams();
  if (options.gameSlug) {
    params.set('gameSlug', options.gameSlug);
  }

  const query = params.toString();
  const source = new EventSource(`${API_BASE}/products/stream${query ? `?${query}` : ''}`);

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data || '{}');
      onUpdate?.(data);
    } catch {
      // Ignore malformed stream payloads.
    }
  };

  source.onopen = () => {
    onUpdate?.({ type: 'open' });
  };

  source.onerror = () => {
    // Browser will attempt automatic reconnect; emit state for UI fallback indicators.
    onUpdate?.({ type: 'error' });
  };

  return () => {
    source.close();
  };
}
