import { jest } from '@jest/globals';

const mockQuote = { _id: 'q1', artisan: 'u1', requester: 'u2', status: 'open', totalAmount: 1500, statusHistory: [], save: jest.fn() };
const mockProject = { _id: 'prj1', name: 'Rénovation Salon', status: 'ongoing' };

jest.unstable_mockModule('../../src/models/Project.model.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    create: jest.fn().mockResolvedValue(mockProject),
    findById: jest.fn().mockResolvedValue(mockProject),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockProject),
    exec: jest.fn().mockResolvedValue([mockProject])
  }
}));

jest.unstable_mockModule('../../src/models/Quote.model.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockQuote),
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([mockQuote]),
    findById: jest.fn().mockImplementation(() => ({ populate: jest.fn().mockResolvedValue(mockQuote) })),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockQuote),
    countDocuments: jest.fn().mockResolvedValue(5),
    exec: jest.fn().mockResolvedValue([mockQuote])
  }
}));

jest.unstable_mockModule('../../src/models/Notification.model.js', () => ({
  default: { create: jest.fn().mockResolvedValue({}) }
}));

const quoteController = await import('../../src/controllers/quote.controller.js');

describe('📋 Quotes & Projects - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: 'u1', firstName: 'Art', lastName: 'I' }, body: {}, params: {}, query: {}, app: { get: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }) } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should create a quote request', async () => {
    req.body = { artisanId: 'u2', title: 'Peinture' };
    await quoteController.createQuote(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should get my quotes', async () => {
    await quoteController.getMyQuotes(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
