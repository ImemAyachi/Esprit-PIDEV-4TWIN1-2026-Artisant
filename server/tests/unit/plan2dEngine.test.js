const { validateArchitecturalRules } = await import('../../src/plan2d/architecturalRules.js');
const { validateAndNormalizePlan2D } = await import('../../src/plan2d/plan2dValidation.js');
const { interpretPrompt } = await import('../../src/plan2d/promptInterpreter.js');

describe('🏗️ Plan2D Engine - Core Logic Tests', () => {
  
  test('Should validate architectural rules for a valid plan', () => {
    const plan = {
      width_m: 10, height_m: 10,
      rooms: [
        { name: 'Salon', x: 0, y: 0, w: 4, h: 5 },
        { name: 'Cuisine', x: 4, y: 0, w: 3, h: 4 },
        { name: 'SDB', x: 0, y: 5, w: 2, h: 2 },
        { name: 'Chambre', x: 3, y: 5, w: 3, h: 3 }
      ]
    };
    const results = validateArchitecturalRules(plan);
    expect(results).toBeDefined();
  });

  test('Should normalize and validate a 2D plan', () => {
    const rawPlan = {
      width_m: 10, height_m: 10,
      rooms: [
        { name: 'Salon', x: 0, y: 0, w: 4, h: 5 },
        { name: 'Cuisine', x: 4, y: 0, w: 3, h: 4 },
        { name: 'SDB', x: 0, y: 5, w: 2, h: 2 },
        { name: 'Chambre', x: 3, y: 5, w: 3, h: 3 }
      ]
    };
    const normalized = validateAndNormalizePlan2D(rawPlan);
    expect(normalized.ok).toBe(true);
    expect(normalized.data.rooms).toBeDefined();
  });

  test('Should interpret user prompts correctly', () => {
    const prompt = "Je veux une villa de 150m2 avec 3 suites et un grand séjour";
    const interpreted = interpretPrompt(prompt);
    expect(interpreted.intent.area_m2).toBe(150);
  });
});
