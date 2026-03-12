import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TablePagination from '@/components/ui/TablePagination';

describe('TablePagination', () => {
  const defaultProps = {
    currentPage: 2,
    totalPages: 5,
    pageSize: 10 as const,
    pageSizeOptions: [5, 10, 25, 'all'] as const,
    canGoPrevious: true,
    canGoNext: true,
    canGoFirst: true,
    canGoLast: true,
    onFirst: vi.fn(),
    onLast: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  it('renders page size selector', () => {
    render(<TablePagination {...defaultProps} />);
    expect(screen.getByLabelText('Filas por página')).toBeInTheDocument();
  });

  it('calls onFirst when clicking first page button', async () => {
    const user = userEvent.setup();
    const onFirst = vi.fn();
    render(<TablePagination {...defaultProps} onFirst={onFirst} />);

    await user.click(
      screen.getByRole('button', { name: 'Primera página' }),
    );
    expect(onFirst).toHaveBeenCalledOnce();
  });

  it('calls onLast when clicking last page button', async () => {
    const user = userEvent.setup();
    const onLast = vi.fn();
    render(<TablePagination {...defaultProps} onLast={onLast} />);

    await user.click(
      screen.getByRole('button', { name: 'Última página' }),
    );
    expect(onLast).toHaveBeenCalledOnce();
  });

  it('calls onPrevious when clicking previous button', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    render(<TablePagination {...defaultProps} onPrevious={onPrevious} />);

    await user.click(
      screen.getByRole('button', { name: 'Página anterior' }),
    );
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it('calls onNext when clicking next button', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<TablePagination {...defaultProps} onNext={onNext} />);

    await user.click(
      screen.getByRole('button', { name: 'Página siguiente' }),
    );
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('disables first and previous buttons when canGoPrevious is false', () => {
    render(
      <TablePagination
        {...defaultProps}
        canGoPrevious={false}
        canGoFirst={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Primera página' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled();
  });

  it('disables next and last buttons when canGoNext is false', () => {
    render(
      <TablePagination
        {...defaultProps}
        canGoNext={false}
        canGoLast={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Última página' }),
    ).toBeDisabled();
  });

  it('renders always, even with a single page', () => {
    render(
      <TablePagination
        {...defaultProps}
        currentPage={1}
        totalPages={1}
        canGoPrevious={false}
        canGoNext={false}
        canGoFirst={false}
        canGoLast={false}
      />,
    );

    expect(screen.getByLabelText('Filas por página')).toBeInTheDocument();
  });
});
