import { jest } from '@jest/globals';

const mockQuote = { 
    _id: 'q1', 
    status: 'open', 
    requester: { _id: { equals: () => true } },
    artisan: { equals: () => true },
    save: jest.fn().mockResolvedValue(true)
};

const createChainMock = (resolvedValue) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((cb) => Promise.resolve(cb(resolvedValue))),
    exec: jest.fn().mockResolvedValue(resolvedValue)
});

jest.unstable_mockModule('../../src/models/Quote.model.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockQuote),
    find: jest.fn().mockImplementation(() => createChainMock([mockQuote])),
    findById: jest.fn().mockResolvedValue(mockQuote),
    countDocuments: jest.fn().mockResolvedValue(5)
  }
}));

jest.unstable_mockModule('../../src/models/Notification.model.js', () => ({
  default: { create: jest.fn().mockResolvedValue({ _id: 'n1' }) }
}));

const quoteController = await import('../../src/controllers/quote.controller.js');
const ai2dController = await import('../../src/controllers/textTo2dPlan.controller.js');

describe('📄 Quotes & 🤖 AI 2D - Coverage', () => {
  let req, res;

  beforeEach(() => {
    res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn().mockReturnThis(),
        app: { get: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }) }
    };
  });

  test('Should create quote', async () => {
    req = { body: { title: 'Test', artisanId: 'a1' }, user: { _id: 'u1' }, app: res.app };
    await quoteController.createQuote(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should get my quotes', async () => {
    req = { user: { _id: 'u1', role: 'Architecte' }, query: {} };
    await quoteController.getMyQuotes(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  test('Should generate 2D plan', async () => {
    req = { body: { input: 'Villa' } };
    await ai2dController.createTextTo2dPlan(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
