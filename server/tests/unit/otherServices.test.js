import { jest } from '@jest/globals';

const mockDoc = { _id: 'd1', name: 'Plan.pdf', artisan: 'u1' };
const mockInvoice = { _id: 'i1', amount: 1200, status: 'paid', toObject: () => ({ _id: 'i1' }) };
const mockUser = { _id: 'u1', firstName: 'Ahmed', craft: 'maçon', role: 'Artisan', location: { lat: 36, lng: 10 } };

jest.unstable_mockModule('../../src/models/Document.js', () => ({
  default: { find: jest.fn().mockReturnThis(), populate: jest.fn().mockImplementation(() => Promise.resolve([mockDoc])), create: jest.fn().mockResolvedValue(mockDoc) }
}));

jest.unstable_mockModule('../../src/models/Invoice.js', () => ({
  default: { 
    find: jest.fn().mockReturnThis(), 
    populate: jest.fn().mockReturnThis(), 
    sort: jest.fn().mockImplementation(() => Promise.resolve([mockInvoice])), 
    create: jest.fn().mockResolvedValue(mockInvoice),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockInvoice)
  }
}));

jest.unstable_mockModule('../../src/models/User.model.js', () => ({
  default: { 
    find: jest.fn().mockReturnThis(), 
    countDocuments: jest.fn().mockResolvedValue(10),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(() => Promise.resolve([mockUser]))
  }
}));

const documentController = await import('../../src/controllers/documentController.js');
const invoiceController = await import('../../src/controllers/invoiceController.js');
const workforceController = await import('../../src/controllers/workforce.controller.js');

describe('📦 Remaining Services (Docs, Invoices, Workforce) - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: 'u1', id: 'u1' }, params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should retrieve all documents', async () => {
    await documentController.getAllDocuments(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should retrieve my invoices', async () => {
    await invoiceController.getMyInvoices(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should get workforce stats', async () => {
    await workforceController.getWorkforceStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
