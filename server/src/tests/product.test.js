import { jest } from '@jest/globals';
import * as productController from '../controllers/product.controller.js';
import Product from '../models/Product.model.js';

jest.mock('../models/Product.model.js');

describe('Product Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return a list of products', async () => {
      const mockProducts = [{ name: 'Sable 0/4', price: 50 }];
      
      // Mongoose chain mocking
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      };
      
      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(1);

      await productController.getProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: mockProducts
      }));
    });
  });

  describe('getProductById', () => {
    it('should return a product if it exists', async () => {
      const mockProduct = { name: 'Gravier', views: 10 };
      req.params.id = 'productid';
      
      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct)
      });

      await productController.getProductById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        product: mockProduct
      }));
    });

    it('should throw error if product not found', async () => {
      req.params.id = 'wrongid';
      
      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await productController.getProductById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Produit introuvable'
      }));
    });
  });
});
