export const games = [
  {
    id: 1,
    name: 'Mobile Legends',
    slug: 'mobile-legends',
    icon: '⚔️',
    banner: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    accentColor: '#e94560',
    currency: 'Diamonds',
    requiresZoneId: true,
    publisher: 'Moonton',
    status: 'active'
  },
  {
    id: 2,
    name: 'Free Fire',
    slug: 'free-fire',
    icon: '🔥',
    banner: 'linear-gradient(135deg, #0d1b2a, #1b2838, #2d4059)',
    accentColor: '#ff6b35',
    currency: 'Diamonds',
    requiresZoneId: false,
    publisher: 'Garena',
    status: 'active'
  },
  {
    id: 3,
    name: 'PUBG Mobile',
    slug: 'pubg-mobile',
    icon: '🎯',
    banner: 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #4a4a2e)',
    accentColor: '#f5c518',
    currency: 'UC',
    requiresZoneId: false,
    publisher: 'Krafton',
    status: 'active'
  },
  {
    id: 4,
    name: 'Valorant',
    slug: 'valorant',
    icon: '🎮',
    banner: 'linear-gradient(135deg, #0f1923, #1a2332, #ff4655)',
    accentColor: '#ff4655',
    currency: 'VP',
    requiresZoneId: false,
    publisher: 'Riot Games',
    status: 'active'
  },
  {
    id: 5,
    name: 'Genshin Impact',
    slug: 'genshin-impact',
    icon: '✨',
    banner: 'linear-gradient(135deg, #1a1a2e, #2d1b69, #5b21b6)',
    accentColor: '#a78bfa',
    currency: 'Genesis Crystals',
    requiresZoneId: false,
    publisher: 'HoYoverse',
    status: 'active'
  },
  {
    id: 6,
    name: 'Call of Duty Mobile',
    slug: 'cod-mobile',
    icon: '💥',
    banner: 'linear-gradient(135deg, #1a1a1a, #2d1f0e, #4a3520)',
    accentColor: '#f97316',
    currency: 'CP',
    requiresZoneId: false,
    publisher: 'Activision',
    status: 'active'
  },
  {
    id: 7,
    name: 'Honkai Star Rail',
    slug: 'honkai-star-rail',
    icon: '🌟',
    banner: 'linear-gradient(135deg, #0c0a1d, #1e1b4b, #312e81)',
    accentColor: '#818cf8',
    currency: 'Oneiric Shards',
    requiresZoneId: false,
    publisher: 'HoYoverse',
    status: 'active'
  },
  {
    id: 8,
    name: 'League of Legends',
    slug: 'league-of-legends',
    icon: '🏆',
    banner: 'linear-gradient(135deg, #091428, #0a1428, #0a3d62)',
    accentColor: '#c8aa6e',
    currency: 'RP',
    requiresZoneId: false,
    publisher: 'Riot Games',
    status: 'active'
  }
];

export const getGameBySlug = (slug) => games.find(g => g.slug === slug);
export const getGameById = (id) => games.find(g => g.id === id);
