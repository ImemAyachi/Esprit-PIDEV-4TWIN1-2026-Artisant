import { jest } from '@jest/globals';

const mockInvoice = { _id: 'i1', amount: 500, status: 'en_attente', toObject: () => ({ _id: 'i1' }) };

const createChainMock = (resolvedValue) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(resolvedValue),
  then: jest.fn((cb) => Promise.resolve(cb(resolvedValue))),
  catch: jest.fn().mockReturnThis()
});

jest.unstable_mockModule('../../src/models/Invoice.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockInvoice),
    find: jest.fn().mockImplementation(() => createChainMock([mockInvoice])),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockInvoice),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockInvoice)
  }
}));

jest.unstable_mockModule('../../src/models/User.model.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([{ firstName: 'Ali', location: { lat: 36, lng: 10 } }]),
    countDocuments: jest.fn().mockResolvedValue(10)
  }
}));

const invoiceController = await import('../../src/controllers/invoiceController.js');
const workforceController = await import('../../src/controllers/workforce.controller.js');

describe('💰 Invoices & 👷 Workforce - Coverage', () => {
  let req, res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  test('Should create invoice', async () => {
    req = { body: { amount: 100 }, user: { id: 'u1' } };
    await invoiceController.createInvoice(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should get my invoices', async () => {
    req = { user: { id: 'u1' } };
    await invoiceController.getMyInvoices(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should get workforce stats', async () => {
    await workforceController.getWorkforceStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
