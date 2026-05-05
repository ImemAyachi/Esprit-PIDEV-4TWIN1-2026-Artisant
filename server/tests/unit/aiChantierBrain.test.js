import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/models/User.model.js', () => ({
  default: { find: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) }
}));

jest.unstable_mockModule('../../src/models/Product.model.js', () => ({
  default: { find: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) }
}));

jest.unstable_mockModule('groq-sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: '{"isConsistent": true, "phases": []}' } }] }) } }
  }))
}));

const { runChantierBrain } = await import('../../src/controllers/aiChantierBrain.controller.js');

describe('🧠 AI ChantierBrain - Full Suite', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { projectDescription: 'Construction villa moderne', budget: 100000 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should run AI analysis', async () => {
    await runChantierBrain(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
