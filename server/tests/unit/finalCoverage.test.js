import { jest } from '@jest/globals';

const mockUser = { _id: 'u1', firstName: 'Ala', email: 'ala@test.com', isActive: true, save: jest.fn().mockResolvedValue(true) };

jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    findById: jest.fn().mockResolvedValue(mockUser),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser),
    select: jest.fn().mockReturnThis(),
    countDocuments: jest.fn().mockResolvedValue(100),
    aggregate: jest.fn().mockResolvedValue([{ _id: 'artisan', count: 50 }])
  }
}));

jest.unstable_mockModule('../../src/models/Order.js', () => ({
  default: { 
    find: jest.fn().mockResolvedValue([{ totalPrice: 500 }, { totalPrice: 500 }]),
    aggregate: jest.fn().mockResolvedValue([{ total: 1000 }]) 
  }
}));

jest.unstable_mockModule('../../src/models/Project.js', () => ({
  default: { countDocuments: jest.fn().mockResolvedValue(5) }
}));

const userController = await import('../../src/controllers/userController.js');
const statsController = await import('../../src/controllers/statsController.js');

describe('👥 User Management & Stats - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      params: { id: 'u1' }, 
      body: { role: 'artisan' }, 
      query: { search: '', role: '', status: '' }, 
      user: { _id: 'u1' } 
    };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn().mockReturnThis() 
    };
  });

  test('Should get all users for admin', async () => {
    await userController.getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should toggle account status', async () => {
    req.params.id = 'u2'; 
    await userController.toggleAccountStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should get dashboard statistics', async () => {
    await statsController.getStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
