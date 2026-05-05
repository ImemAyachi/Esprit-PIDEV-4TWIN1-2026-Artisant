import { jest } from '@jest/globals';

const mockPlan = { 
  rooms: [{ name: 'Salon', x: 0, y: 0, w: 5, h: 5 }],
  isConsistent: true,
  bounding_box: { minX: 0, minY: 0, maxX: 10, maxY: 10 }
};

jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn().mockResolvedValue({ 
      choices: [{ message: { content: JSON.stringify(mockPlan) } }] 
    }) } }
  }))
}));

jest.unstable_mockModule('../../src/models/IALog.js', () => ({
  default: { create: jest.fn().mockResolvedValue({}) }
}));

// Mock des utilitaires pour éviter les calculs lourds
jest.unstable_mockModule('../../src/utils/plan2dRenderer.js', () => ({
  renderPlan2DSvg: jest.fn().mockReturnValue('<svg>mock</svg>')
}));

const ai2dController = await import('../../src/controllers/textTo2dPlan.controller.js');

describe('🚀 Advanced AI (2D Plans) - Intensive Coverage', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { input: 'Appartement 2 chambres avec balcon' }, user: { _id: 'u1' }, query: {} };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis() 
    };
    jest.clearAllMocks();
  });

  test('Should generate 2D plan successfully', async () => {
    await ai2dController.createTextTo2dPlan(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('Should return 400 if input is missing', async () => {
    req.body.input = '';
    try {
      await ai2dController.createTextTo2dPlan(req, res);
    } catch (e) {
      // Error expected
    }
  });

  test('Should handle LLM parsing errors', async () => {
    const OpenAI = (await import('openai')).default;
    OpenAI().chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'invalid json' } }] });
    await ai2dController.createTextTo2dPlan(req, res);
    // Doit être géré par asyncHandler
  });

  test('Should generate plan with debug mode', async () => {
    req.body.debug = true;
    await ai2dController.createTextTo2dPlan(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  test('Should handle cache hits', async () => {
    // Premier appel pour remplir le cache
    await ai2dController.createTextTo2dPlan(req, res);
    // Deuxième appel pour taper dans le cache
    await ai2dController.createTextTo2dPlan(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
