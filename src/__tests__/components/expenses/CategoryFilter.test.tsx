import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from '@/components/expenses/CategoryFilter';

// Radix Select uses DOM APIs that jsdom doesn't support
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 1, name: 'Comida', color: '#ff0000', created_at: '', updated_at: '' },
      { id: 2, name: 'Transporte', color: '#00ff00', created_at: '', updated_at: '' },
    ],
  }),
}));

describe('CategoryFilter', () => {
  it('renders with "Todas las categorías" when value is null', () => {
    render(<CategoryFilter value={null} onChange={() => {}} />);
    expect(screen.getByText('Todas las categorías')).toBeInTheDocument();
  });

  it('calls onChange with null when "Todas" is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CategoryFilter value={1} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    const options = await screen.findAllByText('Todas las categorías');
    await user.click(options[options.length - 1]);

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with category id when a category is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CategoryFilter value={null} onChange={handleChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Transporte'));

    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
