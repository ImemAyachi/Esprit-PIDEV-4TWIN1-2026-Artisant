import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'ultra_secret_key';

// Mock everything inside factories for ESM safety
jest.unstable_mockModule('../../src/models/User.model.js', () => {
  const mockUser = { 
    _id: 'u1', email: 'auth@test.com', isActive: true, isVerified: true,
    matchPassword: async () => true,
    save: async () => true,
    toObject: function() { return this; }
  };
  const chain = {
    select: () => chain,
    populate: () => chain,
    exec: async () => mockUser,
    then: (cb) => Promise.resolve(cb(mockUser))
  };
  return {
    default: {
      findOne: () => chain,
      findById: async () => mockUser,
      findByIdAndUpdate: () => chain,
      create: async () => mockUser,
      countDocuments: async () => 10
    }
  };
});

jest.unstable_mockModule('../../src/models/User.js', () => {
    const mockUser = { _id: 'u1', isActive: true, role: 'admin' };
    const chain = {
        select: () => chain,
        exec: async () => mockUser,
        then: (cb) => Promise.resolve(cb(mockUser))
    };
    return {
        default: {
            find: () => chain,
            findById: async () => mockUser,
            findByIdAndUpdate: () => chain,
            findByIdAndDelete: async () => mockUser
        }
    };
});

jest.unstable_mockModule('../../src/utils/mailer.js', () => ({ default: async () => true }));
jest.unstable_mockModule('../../src/models/Document.js', () => ({
  default: {
    find: () => ({ populate: () => ({ then: (cb) => cb([]) }) }),
    create: async () => ({ _id: 'd1' })
  }
}));

const authController = await import('../../src/controllers/auth.controller.js');
const userController = await import('../../src/controllers/userController.js');

describe('🚀 ULTRA COVERAGE - Final Attempt', () => {
  let req, res;
  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };
  });

  test('Login check', async () => {
    req = { body: { email: 'auth@test.com', password: 'password' } };
    await authController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Update user role check', async () => {
    req = { params: { id: 'u1' }, body: { role: 'admin' } };
    await userController.updateUserRole(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
