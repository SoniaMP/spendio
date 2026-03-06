import { describe, it, expect } from 'vitest';
import { calcCategoryComparison } from '@/helpers/calcCategoryComparison';
import type { CategoryBreakdown } from '@/types/chartData';

const current: CategoryBreakdown[] = [
  { categoryName: 'Comida', color: '#f00', amount: 500, percentage: 50 },
  { categoryName: 'Transporte', color: '#0f0', amount: 300, percentage: 30 },
  { categoryName: 'Ocio', color: '#00f', amount: 200, percentage: 20 },
];

const comparison: CategoryBreakdown[] = [
  { categoryName: 'Comida', color: '#f00', amount: 400, percentage: 40 },
  { categoryName: 'Transporte', color: '#0f0', amount: 350, percentage: 35 },
  { categoryName: 'Salud', color: '#ff0', amount: 250, percentage: 25 },
];

describe('calcCategoryComparison', () => {
  it('returns empty array when both inputs are empty', () => {
    expect(calcCategoryComparison([], [])).toEqual([]);
  });

  it('includes categories from both months', () => {
    const result = calcCategoryComparison(current, comparison);
    const names = result.map((r) => r.categoryName);
    expect(names).toContain('Comida');
    expect(names).toContain('Transporte');
    expect(names).toContain('Ocio');
    expect(names).toContain('Salud');
  });

  it('calculates positive difference correctly', () => {
    const result = calcCategoryComparison(current, comparison);
    const comida = result.find((r) => r.categoryName === 'Comida')!;
    expect(comida.currentAmount).toBe(500);
    expect(comida.comparisonAmount).toBe(400);
    expect(comida.difference).toBe(100);
    expect(comida.percentageChange).toBe(25);
  });

  it('calculates negative difference correctly', () => {
    const result = calcCategoryComparison(current, comparison);
    const transporte = result.find((r) => r.categoryName === 'Transporte')!;
    expect(transporte.difference).toBe(-50);
    expect(transporte.percentageChange).toBeCloseTo(-14.29, 1);
  });

  it('handles category only in current month', () => {
    const result = calcCategoryComparison(current, comparison);
    const ocio = result.find((r) => r.categoryName === 'Ocio')!;
    expect(ocio.currentAmount).toBe(200);
    expect(ocio.comparisonAmount).toBe(0);
    expect(ocio.percentageChange).toBeNull();
  });

  it('handles category only in comparison month', () => {
    const result = calcCategoryComparison(current, comparison);
    const salud = result.find((r) => r.categoryName === 'Salud')!;
    expect(salud.currentAmount).toBe(0);
    expect(salud.comparisonAmount).toBe(250);
    expect(salud.difference).toBe(-250);
  });

  it('sorts by current amount descending', () => {
    const result = calcCategoryComparison(current, comparison);
    const amounts = result.map((r) => r.currentAmount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });
});
