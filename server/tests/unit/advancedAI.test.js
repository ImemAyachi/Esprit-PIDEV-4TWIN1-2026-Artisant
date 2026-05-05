import { jest } from '@jest/globals';

jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: '{"rooms": []}' } }] }) } }
  }))
}));

jest.unstable_mockModule('../../src/models/IALog.js', () => ({
  default: { create: jest.fn().mockResolvedValue({}) }
}));

const ai2dController = await import('../../src/controllers/textTo2dPlan.controller.js');

describe('🚀 Advanced AI (2D Plans) - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { input: 'Villa 3 chambres' }, user: { _id: 'u1' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should generate 2D plan suggestion', async () => {
    await ai2dController.createTextTo2dPlan(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
