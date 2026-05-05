import { jest } from '@jest/globals';

const mockOrder = { 
  _id: 'o1', orderNumber: 'ORD-123', totalPrice: 500, status: 'en_attente',
  toObject: () => ({ _id: 'o1', orderNumber: 'ORD-123', totalPrice: 500, status: 'en_attente' })
};
const mockProduct = { _id: 'p1', unitPrice: 100, stock: { quantity: 10 }, save: jest.fn() };

jest.unstable_mockModule('../../src/models/Order.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue(mockOrder),
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockOrder),
    findById: jest.fn().mockReturnThis()
  }
}));

jest.unstable_mockModule('../../src/models/OrderItem.js', () => ({
  default: { create: jest.fn().mockResolvedValue({}), find: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis() }
}));

jest.unstable_mockModule('../../src/models/Product.js', () => ({
  default: { find: jest.fn().mockResolvedValue([mockProduct]) }
}));

const { createOrder, getOrderAnalytics } = await import('../../src/controllers/orderController.js');

describe('🛒 Order Controller - Complete Suite', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { id: 'u1', _id: 'u1', role: 'artisan' }, body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Should create a new order', async () => {
    req.body = { items: [{ product: 'p1', quantity: 1 }] };
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Should get analytics', async () => {
    await getOrderAnalytics(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
