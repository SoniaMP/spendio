import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangeFilter from '@/components/summary/DateRangeFilter';
import { DatePreset } from '@/helpers/dateHelpers';

const noop = () => {};

describe('DateRangeFilter', () => {
  it('highlights the active preset', () => {
    render(
      <DateRangeFilter
        preset={DatePreset.ThisYear}
        from="2026-01-01"
        to="2026-12-31"
        onPresetChange={noop}
        onCustomRangeChange={noop}
      />,
    );
    expect(screen.getByText('Año actual')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByText('Este mes')).toHaveAttribute('data-variant', 'outline');
  });

  it('calls onPresetChange when a preset is clicked', () => {
    const onPresetChange = vi.fn();
    render(
      <DateRangeFilter
        preset={DatePreset.ThisMonth}
        from="2026-06-01"
        to="2026-06-30"
        onPresetChange={onPresetChange}
        onCustomRangeChange={noop}
      />,
    );

    fireEvent.click(screen.getByText('Últimos 3 meses'));
    expect(onPresetChange).toHaveBeenCalledWith(DatePreset.Last3Months);
  });

  it('shows date inputs only for the custom preset', () => {
    const { rerender } = render(
      <DateRangeFilter
        preset={DatePreset.ThisMonth}
        from="2026-06-01"
        to="2026-06-30"
        onPresetChange={noop}
        onCustomRangeChange={noop}
      />,
    );
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();

    rerender(
      <DateRangeFilter
        preset={DatePreset.Custom}
        from="2026-06-01"
        to="2026-06-30"
        onPresetChange={noop}
        onCustomRangeChange={noop}
      />,
    );
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });

  it('calls onCustomRangeChange when a custom date changes', () => {
    const onCustomRangeChange = vi.fn();
    render(
      <DateRangeFilter
        preset={DatePreset.Custom}
        from="2026-06-01"
        to="2026-06-30"
        onPresetChange={noop}
        onCustomRangeChange={onCustomRangeChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-05-15' },
    });
    expect(onCustomRangeChange).toHaveBeenCalledWith('2026-05-15', '2026-06-30');
  });
});
