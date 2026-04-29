import { buildSpatialGraph } from './spatialGraphEngine.js';

const input = {
  totalArea: 100,
  totalWidth: 13,
  totalHeight: 8.5,
  rooms: [
    { type: 'bedroom', count: 2 },
    { type: 'living_room', count: 1 },
    { type: 'kitchen', count: 1 },
    { type: 'bathroom', count: 1 },
    { type: 'entry', count: 1 },
  ],
};

const graph = buildSpatialGraph(input);

console.log(JSON.stringify({ rooms: graph.rooms, edges: graph.edges, meta: graph.meta }, null, 2));
