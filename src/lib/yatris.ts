// src/lib/yatris.ts
// Central registry of all Vedic Journeys contributors.
// Add a new yatri here when onboarding them.
// Avatar: place photo at /public/avatars/<handle>.jpg (square, min 200x200)

export interface Yatri {
  handle: string;       // matches user field in blog frontmatter
  displayName: string;  // shown in bylines and profile pages
  bio: string;          // 2-3 sentences shown on profile page
  location: string;     // home base
  avatar: string;       // path to avatar image in /public/
  destinations?: string[]; // notable destinations (optional, shown on profile)
}

export const YATRIS: Record<string, Yatri> = {
  anand: {
    handle: 'anand',
    displayName: 'Anand Dixit',
    bio: 'Pilgrim, technologist, and seeker of stillness. Anand has journeyed across Tibet, Nepal, and the Himalayas, weaving Advaita philosophy into the landscapes he moves through. He writes from the intersection of altitude and inquiry.',
    location: 'San Diego, CA',
    avatar: '/avatars/anand.jpg',
    destinations: ['Mount Kailash', 'Manasarovar', 'Kedarnath', 'Lhasa'],
  },
  vidya: {
    handle: 'vidya',
    displayName: 'Vidya Dixit',
    bio: 'Traveller and contemplative. Vidya brings a quiet, observational lens to sacred spaces, finding the extraordinary in the everyday landscapes of pilgrimage.',
    location: 'San Diego, CA',
    avatar: '/avatars/vidya.jpg',
    destinations: [],
  },
  sethu: {
    handle: 'sethu',
    displayName: 'Sethu Madhava',
    bio: 'Traveller and contemplative. Sethu brings a quiet, observational lens to sacred spaces, finding the extraordinary in the everyday landscapes of pilgrimage.',
    location: 'San Diego, CA',
    avatar: '/avatars/sethu.jpg',
    destinations: [],
  },
  kailash-yatra-2025: {
    handle: 'kailash-yatra-2025',
    displayName: 'Mt. Kailash & Manasarovar Yatra 2025',
    bio: 'A group of 26 members from various backgrounds, coming together and making this piligrimate to Manasarovar & Mount Kailash during July 2025.',
    location: 'San Diego, CA',
    avatar: '/avatars/kailash2025.jpg',
    destinations: [],
  },
};

export function getYatri(handle: string): Yatri {
  return YATRIS[handle] ?? {
    handle,
    displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
    bio: '',
    location: '',
    avatar: '/avatars/default.jpg',
    destinations: [],
  };
}
