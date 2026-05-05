import * as acorn from 'acorn';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DEFAULT = [
  'src/plan2d/architecturalRules.js',
  'src/plan2d/constraintEngine.js',
  'src/plan2d/constraintExtractor.js',
  'src/plan2d/floorPlanArchitectureGuide.js',
  'src/plan2d/intentLayout.js',
  'src/plan2d/layoutGenerator.js',
  'src/plan2d/openPlanSegmentsFromRooms.js',
  'src/plan2d/placeRooms.js',
  'src/plan2d/plan2dValidation.js',
  'src/plan2d/promptInterpreter.js',
  'src/utils/plan2dRenderer.js',
  'src/controllers/textTo2dPlan.controller.js',
  'src/controllers/textTo2dRender.controller.js',
  'src/services/geometryServiceClient.js',
  'src/routes/ai.routes.js',
  'src/middleware/aiFeatureAuth.middleware.js',
];

const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;

function stripComments(source) {
  const ranges = [];
  try {
    acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      allowHashBang: true,
      onComment(isBlock, _text, start, end) {
        ranges.push([start, end]);
      },
    });
  } catch (e) {
    throw new Error(`${e.message}`);
  }
  ranges.sort((a, b) => b[0] - a[0]);
  let out = source;
  for (const [start, end] of ranges) {
    out = out.slice(0, start) + out.slice(end);
  }
  return out.replace(/\n{3,}/g, '\n\n');
}

for (const rel of files) {
  const abs = join(root, rel);
  const src = readFileSync(abs, 'utf8');
  const out = stripComments(src);
  writeFileSync(abs, out, 'utf8');
  console.log('stripped', rel);
}
