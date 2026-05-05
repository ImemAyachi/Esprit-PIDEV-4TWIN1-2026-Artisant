import { jest } from '@jest/globals';

const mockUser = {
  _id: 'auth123',
  email: 'auth@test.com',
  password: 'hashed_password',
  role: 'client',
  isVerified: true,
  isActive: true,
  twoFactorEnabled: false,
  twoFactorCode: null,
  save: jest.fn().mockResolvedValue(true),
  comparePassword: jest.fn().mockResolvedValue(true),
  matchPassword: jest.fn().mockResolvedValue(true)
};

jest.unstable_mockModule('../../src/models/User.model.js', () => ({
  default: {
    findOne: jest.fn().mockReturnThis(),
    select: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
    create: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser)
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn().mockReturnValue({ id: 'auth123' })
  }
}));

const authController = await import('../../src/controllers/auth.controller.js');

describe('🛡️ Auth Controller - Full Coverage Suite', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    // RESET MANDATAIRE de l'état du mock pour éviter les fuites entre tests
    mockUser.twoFactorCode = null; 
    mockUser.isActive = true;
    jest.clearAllMocks();
  });

  test('Should register a new user successfully', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    User.findOne.mockImplementationOnce(() => Promise.resolve(null));
    
    req.body = { firstName: 'Ala', lastName: 'A', email: 'new@test.com', password: 'password123', role: 'Artisan' };
    await authController.register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should login successfully', async () => {
    req.body = { email: 'auth@test.com', password: 'password123' };
    await authController.login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
