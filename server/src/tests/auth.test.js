import { jest } from '@jest/globals';
import * as authController from '../controllers/auth.controller.js';
import User from '../models/User.model.js';
import sendEmail from '../utils/mailer.js';

// Mocking Mongoose and Mailer
jest.mock('../models/User.model.js');
jest.mock('../utils/mailer.js');

describe('Auth Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Artisan'
      };

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      // Mock User.create
      const mockUser = {
        ...req.body,
        _id: 'mockid',
        save: jest.fn().mockResolvedValue(true)
      };
      User.create.mockResolvedValue(mockUser);

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String)
      }));
    });

    it('should throw error if user already exists', async () => {
      req.body = { email: 'existing@example.com' };
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await authController.register(req, res, next);

      // The asyncHandler handles the error and passes it to next or throws
      // In this setup, we expect the AppError to be thrown
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: 'Email déjà utilisé'
      }));
    });
  });
});
