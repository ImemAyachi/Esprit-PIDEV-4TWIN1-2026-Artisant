import { jest } from '@jest/globals';

const mockProduct = {
  _id: 'p1',
  name: 'Ciment',
  price: 20,
  supplier: { equals: jest.fn().mockReturnValue(true) },
  deleteOne: jest.fn().mockResolvedValue(true)
};

jest.unstable_mockModule('../../src/models/Product.model.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    countDocuments: jest.fn().mockResolvedValue(10),
    findById: jest.fn().mockResolvedValue(mockProduct),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockProduct),
    create: jest.fn().mockResolvedValue(mockProduct),
    exec: jest.fn().mockResolvedValue([mockProduct])
  }
}));

const { getProducts, createProduct, updateProduct, deleteProduct } = await import('../../src/controllers/product.controller.js');

describe('📦 Product Controller - Full Coverage', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      query: {}, params: {}, body: {}, user: { _id: 'u1', role: 'supplier' },
      app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) } 
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should get products with success', async () => {
    await getProducts(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('Should create a product', async () => {
    req.body = { name: 'Promo', price: 10 };
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should update product', async () => {
    req.params.id = 'p1';
    req.body.price = 25;
    await updateProduct(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
