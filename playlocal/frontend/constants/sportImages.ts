/**
 * Centralized sport → image URL mapping (US-2.2).
 * Single source of truth for sport card images across GameDiscovery, GameRoom,
 * CreateGame, RosterHeader, and other components.
 *
 * To add a new sport: add an entry to SPORT_IMAGES and optionally update
 * DEFAULT_SPORT_IMAGE for the fallback.
 */

/** Default image URL when sport is not found in the mapping */
export const DEFAULT_SPORT_IMAGE =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1080';

/** Sport name → image URL mapping */
export const SPORT_IMAGES: Record<string, string> = {
  Basketball:
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1080',
  Soccer:
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1080',
  Tennis:
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1080',
  Volleyball:
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=1080',
  Badminton:
    'https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?auto=format&fit=crop&q=80&w=1080',
  Baseball: '/images/sports/baseball.jpg',
  Hockey:
    'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&q=80&w=1080',
  'Ultimate Frisbee': '/images/sports/ultimate-frisbee.jpg',
  'Flag Football':
    'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1080',
  Softball:
    'https://images.unsplash.com/photo-1578432014316-48b448d79d57?auto=format&fit=crop&q=80&w=1080',
  Pickleball:
    'https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?auto=format&fit=crop&q=80&w=1080',
};

/**
 * Returns the image URL for a given sport name.
 * Falls back to DEFAULT_SPORT_IMAGE when the sport is not in the mapping.
 */
export function getSportImage(sport: string): string {
  return SPORT_IMAGES[sport] ?? DEFAULT_SPORT_IMAGE;
}
