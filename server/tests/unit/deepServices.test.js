import { jest } from '@jest/globals';

const mockInvoice = { _id: 'i1', status: 'pending', amount: 500, save: jest.fn().mockResolvedValue(true) };
const mockQuote = { _id: 'q1', status: 'sent', requester: { equals: () => true }, artisan: { equals: () => true }, save: jest.fn().mockResolvedValue(true) };

const createChainMock = (resolvedValue) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(resolvedValue),
    then: jest.fn((cb) => Promise.resolve(cb(resolvedValue))),
    exec: jest.fn().mockResolvedValue(resolvedValue)
});

jest.unstable_mockModule('../../src/models/Invoice.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockInvoice),
    find: jest.fn().mockImplementation(() => createChainMock([mockInvoice])),
    findById: jest.fn().mockResolvedValue(mockInvoice),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockInvoice)
  }
}));

jest.unstable_mockModule('../../src/models/Quote.model.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockQuote),
    find: jest.fn().mockImplementation(() => createChainMock([mockQuote])),
    findById: jest.fn().mockResolvedValue(mockQuote),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockQuote)
  }
}));

jest.unstable_mockModule('../../src/models/Document.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue({ _id: 'd1' }),
    find: jest.fn().mockImplementation(() => createChainMock([])),
    findById: jest.fn().mockResolvedValue({ _id: 'd1' })
  }
}));

jest.unstable_mockModule('../../src/models/Notification.model.js', () => ({
  default: { create: jest.fn().mockResolvedValue({ _id: 'n1' }) }
}));

const invoiceController = await import('../../src/controllers/invoiceController.js');
const quoteController = await import('../../src/controllers/quote.controller.js');
const ai2dController = await import('../../src/controllers/textTo2dPlan.controller.js');

describe('📈 Deep Services Coverage - Corrected', () => {
  let req, res;

  beforeEach(() => {
    res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn().mockReturnThis(),
        app: { get: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }) }
    };
  });

  test('Should create invoice', async () => {
    req = { body: { amount: 100 }, user: { id: 'u1' } };
    await invoiceController.createInvoice(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should record payment (ex payInvoice)', async () => {
    req = { params: { id: 'i1' }, body: { amount: 500 } };
    await invoiceController.recordPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should create quote', async () => {
    req = { body: { title: 'T', artisanId: 'a1', description: 'D' }, user: { _id: 'u1' }, app: res.app };
    await quoteController.createQuote(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should generate 2D plan', async () => {
    req = { body: { input: 'Maison' } };
    await ai2dController.createTextTo2dPlan(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
