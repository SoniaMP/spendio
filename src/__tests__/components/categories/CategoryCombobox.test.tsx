import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryCombobox from '@/components/categories/CategoryCombobox';

const mockCategories = [
  { id: 1, name: 'Alimentación', color: '#EF4444', created_at: '', updated_at: '' },
  { id: 2, name: 'Transporte', color: '#3B82F6', created_at: '', updated_at: '' },
];

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: mockCategories }),
  useCreateCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('CategoryCombobox', () => {
  it('renders the trigger button', () => {
    render(<CategoryCombobox value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows placeholder when no value selected', () => {
    render(<CategoryCombobox value={null} onChange={vi.fn()} />);
    expect(screen.getByText('Seleccionar categoría...')).toBeInTheDocument();
  });

  it('shows selected category name when value is provided', () => {
    render(<CategoryCombobox value={1} onChange={vi.fn()} />);
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
  });
});
