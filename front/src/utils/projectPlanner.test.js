import { describe, it, expect } from 'vitest';
import { extractQuantityFromDescription, detectCategories, generateProjectPlan } from './projectPlanner';

describe('projectPlanner utils', () => {
  describe('extractQuantityFromDescription', () => {
    it('should extract quantity from "qty: 10"', () => {
      expect(extractQuantityFromDescription('Please make qty: 10 mugs')).toBe(10);
    });

    it('should extract quantity from "batch of 50"', () => {
      expect(extractQuantityFromDescription('I need a batch of 50 chairs')).toBe(50);
    });

    it('should extract quantity from "produce 5 items"', () => {
      expect(extractQuantityFromDescription('produce 5 items for the show')).toBe(5);
    });

    it('should extract quantity from "20 units"', () => {
      expect(extractQuantityFromDescription('Order 20 units of ceramic tiles')).toBe(20);
    });

    it('should return 1 by default if no quantity found', () => {
      expect(extractQuantityFromDescription('I want some handmade wood tables')).toBe(1);
    });

    it('should clamp quantity to 1 if negative or zero', () => {
      expect(extractQuantityFromDescription('qty: -5')).toBe(1);
    });
  });

  describe('detectCategories', () => {
    it('should detect ceramic category', () => {
      expect(detectCategories('i want some ceramic tiles')).toContain('ceramic');
    });

    it('should detect wood category', () => {
      expect(detectCategories('wooden table with oak legs')).toContain('wood');
    });

    it('should detect multiple categories', () => {
      const cats = detectCategories('ceramic and wood mix project');
      expect(cats).toContain('ceramic');
      expect(cats).toContain('wood');
    });

    it('should return empty array for unknown text', () => {
      expect(detectCategories('something completely unrelated')).toEqual([]);
    });
  });

  describe('generateProjectPlan', () => {
    it('should generate a default plan for empty input', () => {
      const plan = generateProjectPlan('');
      expect(plan.category).toBe('general artisan project');
      expect(plan.materials).toBeDefined();
    });

    it('should generate a ceramic plan', () => {
      const plan = generateProjectPlan('I want 10 ceramic mugs');
      expect(plan.category).toBe('ceramic production');
      expect(plan.materials).toContain('Clay body');
      expect(plan.experts).toContain('Ceramic artisan');
    });

    it('should handle multi-discipline projects', () => {
      const plan = generateProjectPlan('Wood and metal chair');
      expect(plan.category).toContain('multi-discipline');
      expect(plan.category).toContain('Wood');
      expect(plan.category).toContain('Metal');
    });

    it('should handle invalid input types', () => {
      const plan = generateProjectPlan(null);
      expect(plan.category).toBe('general artisan project');
    });
  });
});
