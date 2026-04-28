/**
 * Architectural grammar — constants (French/Tunisian-inspired norms).
 * Do not mutate at runtime.
 */

export const ZONE_DEFINITIONS = {
  public: ['entry', 'living_room', 'kitchen', 'dining_room'],
  private: ['bedroom', 'bathroom', 'wc', 'dressing'],
  service: ['garage', 'laundry', 'storage', 'boiler_room'],
} as const;

export const ADJACENCY_REQUIRED = [
  { a: 'entry', b: 'living_room', priority: 10 },
  { a: 'living_room', b: 'kitchen', priority: 9 },
  { a: 'bedroom', b: 'bathroom', priority: 8 },
  { a: 'entry', b: 'corridor', priority: 8 },
  { a: 'kitchen', b: 'dining_room', priority: 7 },
  { a: 'garage', b: 'laundry', priority: 6 },
] as const;

export const ADJACENCY_FORBIDDEN = [
  { a: 'bedroom', b: 'kitchen' },
  { a: 'bedroom', b: 'entry' },
  { a: 'wc', b: 'kitchen' },
  { a: 'wc', b: 'dining_room' },
  { a: 'bathroom', b: 'kitchen' },
] as const;

export const EXTERIOR_WALL_PRIORITY = {
  living_room: 1,
  master_bedroom: 2,
  kitchen: 3,
  bedroom: 4,
  bathroom: 99,
  wc: 99,
  storage: 99,
} as const;

export const ACCESS_RULES = {
  bedroom: 'corridor_or_direct_from_corridor',
  bathroom: 'direct_from_bedroom_or_corridor',
  wc: 'direct_from_corridor',
  kitchen: 'direct_from_living_or_dining',
  living_room: 'direct_from_entry',
  entry: 'exterior_wall',
  garage: 'exterior_wall',
} as const;

/** Minimum useful areas (m²) */
export const MIN_ROOM_SIZES = {
  bedroom: 9,
  master_bedroom: 12,
  living_room: 20,
  kitchen: 8,
  bathroom: 4,
  wc: 1.5,
  entry: 3,
  corridor: 0,
  garage: 18,
  laundry: 4,
  storage: 2,
} as const;

export const MIN_CORRIDOR_WIDTH = 0.9;
export const MAX_CORRIDOR_LENGTH = 6;
export const MIN_DOOR_CLEARANCE = 0.9;
