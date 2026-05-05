import { jest } from '@jest/globals';
import { AppError } from '../../src/middleware/error.middleware.js';

const { errorHandler } = await import('../../src/middleware/error.middleware.js');

describe('🚨 Error Middleware - Full Coverage', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn().mockReturnThis() 
    };
    next = jest.fn();
  });

  test('Should handle AppError correctly', () => {
    const error = new AppError('Custom Error', 400);
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Custom Error' }));
  });

  test('Should handle generic errors', () => {
    const error = new Error('Secret Internal Error');
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('Should handle Mongoose ValidationError', () => {
    const error = { 
      name: 'ValidationError', 
      errors: { field: { message: 'Required' } } 
    };
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Required' }));
  });
});
