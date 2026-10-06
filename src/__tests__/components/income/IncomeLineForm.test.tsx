import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomeLineForm from '@/components/income/IncomeLineForm';

const onSubmit = vi.fn();

function renderForm() {
  return render(
    <IncomeLineForm
      monthLabel="octubre 2026"
      isPending={false}
      onSubmit={onSubmit}
    />,
  );
}

beforeEach(() => {
  onSubmit.mockReset();
});

describe('IncomeLineForm', () => {
  it('renders the three fields', () => {
    renderForm();

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    expect(screen.getByLabelText('Periodicidad')).toBeInTheDocument();
  });

  it('keeps submit disabled until a label and a positive amount are given', async () => {
    renderForm();
    const submit = screen.getByRole('button', { name: 'Crear' });

    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Nombre'), 'Nómina');
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Importe'), '1600');
    expect(submit).toBeEnabled();
  });

  it('rejects a blank label and a non-positive amount', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('Nombre'), '   ');
    await userEvent.type(screen.getByLabelText('Importe'), '0');

    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
  });

  it('defaults to recurring and trims the label', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('Nombre'), '  Nómina  ');
    await userEvent.type(screen.getByLabelText('Importe'), '1600');
    await userEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(onSubmit).toHaveBeenCalledWith({
      label: 'Nómina',
      amount: 1600,
      isRecurring: true,
    });
  });

  it('submits a single-month line when that option is picked', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('Nombre'), 'Paga extra');
    await userEvent.type(screen.getByLabelText('Importe'), '300');
    await userEvent.click(screen.getByLabelText('Periodicidad'));
    await userEvent.click(screen.getByRole('option', { name: /solo en/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(onSubmit).toHaveBeenCalledWith({
      label: 'Paga extra',
      amount: 300,
      isRecurring: false,
    });
  });

  it('names the month in both recurrence options so the choice is unambiguous', async () => {
    renderForm();

    await userEvent.click(screen.getByLabelText('Periodicidad'));

    expect(
      screen.getByRole('option', { name: 'Todos los meses desde octubre 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Solo en octubre 2026' }),
    ).toBeInTheDocument();
  });

  it('blocks submitting twice while the request is in flight', () => {
    render(
      <IncomeLineForm monthLabel="octubre 2026" isPending onSubmit={onSubmit} />,
    );

    expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled();
  });
});
