import { jest } from '@jest/globals';

const mockInvoice = { _id: 'i1', amount: 500, status: 'en_attente', toObject: () => ({ _id: 'i1' }) };

jest.unstable_mockModule('../../src/models/Invoice.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockInvoice),
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockImplementation(() => Promise.resolve([mockInvoice])),
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

describe('💰 Invoices & 👷 Workforce - Coverage Boost (Fixed)', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: { id: 'i1' }, query: {}, user: { id: 'u1' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  test('Should create invoice', async () => {
    req.body = { amount: 100 };
    await invoiceController.createInvoice(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should get my invoices', async () => {
    await invoiceController.getMyInvoices(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should record payment', async () => {
    req.body = { amount: 500 };
    await invoiceController.recordPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should void invoice', async () => {
    await invoiceController.voidInvoice(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should get workforce stats', async () => {
    await workforceController.getWorkforceStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should match workforce', async () => {
    req.body = { 
        userLocation: { latitude: 36, longitude: 10 },
        requiredExperts: ['plumber']
    };
    await workforceController.matchWorkforce(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
