import { jest } from '@jest/globals';

const mockUser = { _id: 'u1', username: 'user1', role: 'client', isActive: true, save: jest.fn() };

jest.unstable_mockModule('../../src/models/User.model.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockImplementation(() => Promise.resolve([mockUser])),
    countDocuments: jest.fn().mockResolvedValue(100),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    aggregate: jest.fn().mockImplementation(() => Promise.resolve([])),
    exec: jest.fn().mockResolvedValue([mockUser])
  }
}));

jest.unstable_mockModule('../../src/models/Product.model.js', () => ({
  default: { countDocuments: jest.fn().mockResolvedValue(50) }
}));

jest.unstable_mockModule('../../src/models/Quote.model.js', () => ({
  default: { countDocuments: jest.fn().mockResolvedValue(20) }
}));

jest.unstable_mockModule('../../src/models/Order.model.js', () => ({
  default: {
    countDocuments: jest.fn().mockResolvedValue(10),
    aggregate: jest.fn().mockImplementation(() => Promise.resolve([{ total: 5000 }]))
  }
}));

const adminController = await import('../../src/controllers/admin.controller.js');

describe('👨‍💼 Admin & Stats Controllers - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should get all users for admin', async () => {
    await adminController.getAllUsers(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('Should toggle user status', async () => {
    req.params.id = 'u1';
    await adminController.toggleUserStatus(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
