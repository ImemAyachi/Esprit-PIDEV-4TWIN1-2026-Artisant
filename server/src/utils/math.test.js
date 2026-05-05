import { calculateTotal } from './math.js';

describe('Math Utility Tests', () => {
  test('should calculate total correctly without tax', () => {
    expect(calculateTotal(10, 5)).toBe(50);
  });

  test('should calculate total correctly with tax', () => {
    expect(calculateTotal(100, 1, 0.2)).toBe(120);
  });

  test('should return 0 for negative values', () => {
    expect(calculateTotal(-10, 5)).toBe(0);
    expect(calculateTotal(10, -5)).toBe(0);
  });
});
