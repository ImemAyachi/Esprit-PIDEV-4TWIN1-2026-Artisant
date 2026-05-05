import { jest } from '@jest/globals';

const mockDoc = {
  _id: 'doc123',
  title: 'Test Doc',
  owner: 'auth123',
  fileUrl: 'http://test.com/doc.pdf',
  save: jest.fn().mockResolvedValue(true)
};

jest.unstable_mockModule('../../src/models/Document.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockImplementation(() => Promise.resolve([mockDoc])),
    create: jest.fn().mockResolvedValue(mockDoc),
    findById: jest.fn().mockResolvedValue(mockDoc),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockDoc)
  }
}));

const documentController = await import('../../src/controllers/documentController.js');

describe('📄 Document Controller - Unit Tests (Fixed)', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: { id: 'doc123' }, query: {}, user: { id: 'auth123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  test('Should get all documents', async () => {
    await documentController.getAllDocuments(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });

  test('Should create a document', async () => {
    req.body = { title: 'New Doc', fileUrl: 'http://new.com/doc.pdf' };
    await documentController.createDocument(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should delete a document', async () => {
    await documentController.deleteDocument(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
