import { jest } from '@jest/globals';

const mockChat = { _id: 'c1', participants: ['u1', 'u2'], turns: [], save: jest.fn().mockResolvedValue(true) };

jest.unstable_mockModule('../../src/models/ChatSession.model.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockImplementation(() => Promise.resolve(mockChat)),
    create: jest.fn().mockResolvedValue(mockChat),
    exec: jest.fn().mockResolvedValue([mockChat])
  }
}));

jest.unstable_mockModule('../../src/models/Product.model.js', () => ({
  default: { find: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockImplementation(() => Promise.resolve([])) }
}));

jest.unstable_mockModule('../../src/utils/cloudAiClient.js', () => ({
  callCloudAI: jest.fn().mockResolvedValue('Hello from AI')
}));

const chatController = await import('../../src/controllers/chat.controller.js');

describe('💬 Chat Service - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: 'u1' }, body: { messages: [{ parts: [{ text: 'Hi' }] }] } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should execute chat turn', async () => {
    await chatController.chat(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ reply: 'Hello from AI' }));
  });
});
