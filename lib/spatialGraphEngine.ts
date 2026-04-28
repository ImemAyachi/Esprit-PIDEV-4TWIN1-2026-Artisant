/**
 * Graph-based spatial placement — phase 1: topology only (no x/y placement yet).
 */

import {
  ACCESS_RULES,
  ADJACENCY_FORBIDDEN,
  ADJACENCY_REQUIRED,
  EXTERIOR_WALL_PRIORITY,
  MIN_ROOM_SIZES,
  ZONE_DEFINITIONS,
} from './architecturalRules.js';

type Zone = 'public' | 'private' | 'service';

type PublicRoom = (typeof ZONE_DEFINITIONS)['public'][number] | 'corridor';
type PrivateRoom = (typeof ZONE_DEFINITIONS)['private'][number];
type ServiceRoom = (typeof ZONE_DEFINITIONS)['service'][number];

/** All assignable semantic room kinds (incl. corridor, used when circulation is modeled). */
export type RoomKind = PublicRoom | PrivateRoom | ServiceRoom;

export interface Room {
  id: string;
  type: RoomKind;
  label: string;
  area: number;
  width: number;
  height: number;
  zone: Zone;
  x?: number;
  y?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  hasExteriorWall: boolean;
  accessVia: string[];
  adjacentTo: string[];
}

export interface SpatialGraphEdge {
  from: string;
  to: string;
  type: 'required' | 'optional' | 'forbidden' | 'access';
}

export interface SpatialGraph {
  rooms: Room[];
  edges: SpatialGraphEdge[];
  corridor?: Room;
  meta?: {
    totalAreaRequested: number;
    totalAreaAllocated: number;
    warnings: string[];
  };
}

/** Input bundle for graph construction (before pixel / SVG placement). */
export interface LayoutConstraintsInput {
  totalArea: number;
  totalWidth: number;
  totalHeight: number;
  rooms: Array<{ type: string; count: number }>;
}

function zoneForType(type: string): Zone {
  const t = type as RoomKind;
  if ((ZONE_DEFINITIONS.public as readonly string[]).includes(type)) return 'public';
  if ((ZONE_DEFINITIONS.private as readonly string[]).includes(type)) return 'private';
  if ((ZONE_DEFINITIONS.service as readonly string[]).includes(type)) return 'service';
  if (type === 'corridor') return 'public';
  return 'private';
}

function minAreaForType(type: string): number {
  const k = type as keyof typeof MIN_ROOM_SIZES;
  if (k in MIN_ROOM_SIZES) return MIN_ROOM_SIZES[k];
  return 4;
}

function priorityExterior(type: string): number {
  const k = type as keyof typeof EXTERIOR_WALL_PRIORITY;
  if (k in EXTERIOR_WALL_PRIORITY) return EXTERIOR_WALL_PRIORITY[k] as number;
  return 50;
}

/**
 * Prototype dimensions from area (m²) using a mild landscape bias for day zones.
 */
function sizeFromArea(area: number, type: string): { width: number; height: number } {
  const a = Math.max(0.5, area);
  let aspect = 1.35;
  if (type === 'corridor') aspect = 8;
  if (type === 'entry') aspect = 1.2;
  if (type === 'living_room') aspect = 1.4;
  const height = Math.sqrt(a / aspect);
  const width = a / height;
  return { width: round2(width), height: round2(height) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function expandRequestedRooms(input: LayoutConstraintsInput): Array<{ type: string; index: number }> {
  const out: Array<{ type: string; index: number }> = [];
  for (const spec of input.rooms) {
    const c = Math.max(0, Math.floor(spec.count));
    for (let i = 0; i < c; i++) {
      out.push({ type: spec.type, index: i + 1 });
    }
  }
  return out;
}

function allocateAreas(
  instances: Array<{ type: string; index: number }>,
  totalArea: number
): Map<string, number> {
  const ids = instances.map((i) => `${i.type}_${i.index}`);
  const mins = instances.map((i) => minAreaForType(i.type));
  const sumMin = mins.reduce((s, m) => s + m, 0);
  const warnings: string[] = [];
  if (sumMin > totalArea + 1e-6) {
    warnings.push(
      `Sum of minimum room areas (${round2(sumMin)} m²) exceeds requested total (${totalArea} m²); allocating proportional mass anyway.`
    );
  }
  const remaining = Math.max(0, totalArea - sumMin);
  const flex = mins.map((m) => m);
  const sumFlex = flex.reduce((s, f) => s + f, 0) || 1;
  const areaMap = new Map<string, number>();
  ids.forEach((id, idx) => {
    const base = mins[idx];
    const extra = remaining * (flex[idx] / sumFlex);
    areaMap.set(id, round2(base + extra));
  });
  const tot = [...areaMap.values()].reduce((a, b) => a + b, 0);
  if (tot > 0 && Math.abs(tot - totalArea) > 0.01) {
    const scale = totalArea / tot;
    for (const id of ids) {
      areaMap.set(id, round2((areaMap.get(id) || 0) * scale));
    }
  }
  return areaMap;
}

function labelFor(type: string, index: number): string {
  const map: Record<string, string> = {
    bedroom: 'Chambre',
    living_room: 'Séjour',
    kitchen: 'Cuisine',
    bathroom: 'Salle de bain',
    entry: 'Entrée',
    wc: 'WC',
    dining_room: 'Salle à manger',
    garage: 'Garage',
    laundry: 'Buanderie',
    storage: 'Rangement',
    corridor: 'Couloir',
    dressing: 'Dressing',
    boiler_room: 'Chaufferie',
  };
  const base = map[type] || type;
  if (type === 'bedroom') return `${base} ${index}`;
  return base;
}

function buildAccessHints(type: string): string[] {
  const rule = (ACCESS_RULES as Record<string, string | undefined>)[type];
  if (!rule) return [];
  if (rule === 'exterior_wall') return ['exterior'];
  return [rule];
}

/**
 * Step 1 — Build a spatial graph: room nodes + required/forbidden/access edges.
 * No coordinates assigned (x/y undefined).
 */
export function buildSpatialGraph(constraints: LayoutConstraintsInput): SpatialGraph {
  const warnings: string[] = [];
  const instances = expandRequestedRooms(constraints);
  if (instances.length === 0) {
    return {
      rooms: [],
      edges: [],
      meta: {
        totalAreaRequested: constraints.totalArea,
        totalAreaAllocated: 0,
        warnings: ['No room instances requested.'],
      },
    };
  }

  const areaById = allocateAreas(instances, constraints.totalArea);
  const allocated = [...areaById.values()].reduce((a, b) => a + b, 0);

  const rooms: Room[] = instances.map((inst) => {
    const id = `${inst.type}_${inst.index}`;
    const area = areaById.get(id) || minAreaForType(inst.type);
    const { width, height } = sizeFromArea(area, inst.type);
    const zone = zoneForType(inst.type);
    const ext = priorityExterior(inst.type) < 90;
    return {
      id,
      type: inst.type as RoomKind,
      label: labelFor(inst.type, inst.index),
      area,
      width,
      height,
      zone,
      hasExteriorWall: ext || inst.type === 'entry' || inst.type === 'garage',
      accessVia: buildAccessHints(inst.type),
      adjacentTo: [],
    };
  });

  const byType = new Map<string, Room[]>();
  for (const r of rooms) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r);
  }

  const getOne = (t: string) => byType.get(t)?.[0];
  const getAll = (t: string) => byType.get(t) ?? [];

  const edges: SpatialGraphEdge[] = [];

  const idPairKey = (a: string, b: string) => [a, b].sort().join('|');

  function addEdge(from: string, to: string, type: SpatialGraphEdge['type']) {
    if (from === to) return;
    const key = idPairKey(from, to);
    const exists = edges.some(
      (e) => idPairKey(e.from, e.to) === key && e.type === type
    );
    if (!exists) edges.push({ from, to, type });
  }

  // --- Required / optional adjacency (instantiated to concrete room ids) ---
  for (const req of ADJACENCY_REQUIRED) {
    const aa = req.a as string;
    const bb = req.b as string;
    const A = getAll(aa);
    const B = getAll(bb);
    if (aa === 'bedroom' && bb === 'bathroom') {
      const bath = getOne('bathroom');
      if (bath) {
        for (const bed of getAll('bedroom')) {
          addEdge(bed.id, bath.id, 'required');
        }
      }
      continue;
    }
    if (aa === 'entry' && bb === 'living_room') {
      const e = getOne('entry');
      const l = getOne('living_room');
      if (e && l) addEdge(e.id, l.id, 'required');
      continue;
    }
    if (aa === 'living_room' && bb === 'kitchen') {
      const l = getOne('living_room');
      const k = getOne('kitchen');
      if (l && k) addEdge(l.id, k.id, 'required');
      continue;
    }
    if (aa === 'entry' && bb === 'corridor') {
      const e = getOne('entry');
      const c = getOne('corridor');
      if (e && c) addEdge(e.id, c.id, 'required');
      else if (!c) warnings.push('Adjacency entry↔corridor skipped: no corridor node (addCorridorIfNeeded may insert one later).');
      continue;
    }
    if (aa === 'kitchen' && bb === 'dining_room') {
      const k = getOne('kitchen');
      const d = getOne('dining_room');
      if (k && d) addEdge(k.id, d.id, 'optional');
      continue;
    }
    if (aa === 'garage' && bb === 'laundry') {
      const g = getOne('garage');
      const lau = getOne('laundry');
      if (g && lau) addEdge(g.id, lau.id, 'optional');
      continue;
    }
  }

  // --- Forbidden adjacencies (expanded to instance pairs) ---
  for (const f of ADJACENCY_FORBIDDEN) {
    const As = getAll(f.a);
    const Bs = getAll(f.b);
    for (const ra of As) {
      for (const rb of Bs) {
        addEdge(ra.id, rb.id, 'forbidden');
      }
    }
  }

  // --- Access edges (semantic, parallel to rules) ---
  const entry = getOne('entry');
  const living = getOne('living_room');
  if (entry && living) {
    addEdge(entry.id, living.id, 'access');
  }
  const kitchen = getOne('kitchen');
  if (living && kitchen) {
    addEdge(living.id, kitchen.id, 'access');
  }
  for (const bed of getAll('bedroom')) {
    const bath = getOne('bathroom');
    if (bath) addEdge(bed.id, bath.id, 'access');
  }
  const wc = getOne('wc');
  if (wc) {
    const corridor = getOne('corridor');
    if (corridor) addEdge(wc.id, corridor.id, 'access');
  }

  // Populate adjacentTo pre-placement as "desired" from required edges only
  const desired = new Map<string, Set<string>>();
  for (const e of edges) {
    if (e.type !== 'required') continue;
    if (!desired.has(e.from)) desired.set(e.from, new Set());
    if (!desired.has(e.to)) desired.set(e.to, new Set());
    desired.get(e.from)!.add(e.to);
    desired.get(e.to)!.add(e.from);
  }
  for (const r of rooms) {
    r.adjacentTo = [...(desired.get(r.id) ?? [])];
  }

  if (Math.abs(allocated - constraints.totalArea) > constraints.totalArea * 0.05 + 0.01) {
    warnings.push(
      `Allocated total area ${round2(allocated)} m² differs from requested ${constraints.totalArea} m² by >5% after normalization.`
    );
  }

  return {
    rooms,
    edges,
    corridor: undefined,
    meta: {
      totalAreaRequested: constraints.totalArea,
      totalAreaAllocated: allocated,
      warnings,
    },
  };
}
