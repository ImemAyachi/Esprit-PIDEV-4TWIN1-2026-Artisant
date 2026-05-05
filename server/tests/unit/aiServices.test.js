import { jest } from '@jest/globals';

const mockProduct = { 
  _id: 'p1', 
  name: 'Briques', 
  price: 10, 
  category: 'Gros Oeuvre', 
  rating: { average: 4.5 },
  specifications: [{ key: 'Score IA', value: '95' }],
  toObject: jest.fn().mockReturnValue({ _id: 'p1', aiScoreGlobal: 80, rating: { average: 4.5 } }) 
};

jest.unstable_mockModule('../../src/models/Product.model.js', () => ({
  default: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockResolvedValue([mockProduct]),
    countDocuments: jest.fn().mockResolvedValue(1),
    aggregate: jest.fn().mockResolvedValue([{ avgScore: 80 }])
  }
}));

jest.unstable_mockModule('../../src/utils/aiClient.js', () => ({
  callLocalLLM: jest.fn().mockResolvedValue('Recommandation IA')
}));

const searchController = await import('../../src/controllers/aiMLSearch.controller.js');
const recommendationController = await import('../../src/controllers/aiProductRecommendation.controller.js');

describe('🔍 ML Search & Recommendations - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      query: { q: 'briques' }, 
      body: { query: 'briques', context: 'salon' }, 
      user: { _id: 'u1' } 
    };
    res = { 
      status: jest.fn().mockReturnThis(), 
      json: jest.fn().mockReturnThis() 
    };
    jest.clearAllMocks();
  });

  test('Should search products using ML', async () => {
    await searchController.mlSearchProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Should get AI product recommendations', async () => {
    await recommendationController.recommendProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
