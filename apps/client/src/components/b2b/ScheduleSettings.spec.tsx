import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleSettings } from './ScheduleSettings';
import { b2bService, type B2bShiftRule } from '../../services/b2bService';

const rules: B2bShiftRule[] = [
  { id: 'rule-1', courtId: 'court-1', weekday: 1, startTime: '15:00', endTime: '16:00', durationHours: 1, priceCentsArs: 15000, active: true },
  { id: 'rule-2', courtId: 'court-1', weekday: 2, startTime: '18:00', endTime: '19:00', durationHours: 1, priceCentsArs: 15000, active: true },
];

beforeEach(() => {
  vi.spyOn(b2bService, 'getShiftRules').mockResolvedValue(rules);
  vi.spyOn(b2bService, 'createShiftRule').mockResolvedValue(rules[0]);
  vi.spyOn(b2bService, 'deleteShiftRule').mockResolvedValue({ deleted: true });
  vi.spyOn(b2bService, 'generateMonthlyShifts').mockResolvedValue([{ id: 'shift-1' } as never]);
  vi.spyOn(b2bService, 'createAvailabilityBlock').mockResolvedValue({} as never);
});

describe('ScheduleSettings', () => {
  it('muestra reglas del día elegido y permite eliminar una hora', async () => {
    const user = userEvent.setup();
    render(<ScheduleSettings courts={[{ id: 'court-1', name: 'Cancha 1' }]} />);

    expect(await screen.findByText(/15:00–16:00/)).toBeInTheDocument();
    expect(screen.queryByText(/18:00–19:00/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar turno 15:00 del Lunes' }));

    expect(b2bService.deleteShiftRule).toHaveBeenCalledWith('court-1', 'rule-1');
  });

  it('permite seleccionar el día al agregar un turno', async () => {
    const user = userEvent.setup();
    const { container } = render(<ScheduleSettings courts={[{ id: 'court-1', name: 'Cancha 1' }]} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Día a modificar' }), '2');
    await user.type(container.querySelector('input[name="startTime"]')!, '17:00');
    await user.type(container.querySelector('input[name="endTime"]')!, '18:00');
    await user.type(screen.getByLabelText('Precio ARS'), '150');
    await user.click(screen.getByRole('button', { name: 'Guardar regla' }));

    await waitFor(() => expect(b2bService.createShiftRule).toHaveBeenCalledWith('court-1', {
      weekday: 2,
      startTime: '17:00',
      endTime: '18:00',
      durationHours: 1,
      priceCentsArs: 15000,
    }));
  });

  it('genera el mes completo y muestra la confirmación en la página', async () => {
    render(<ScheduleSettings courts={[{ id: 'court-1', name: 'Cancha 1' }]} />);

    await userEvent.click(await screen.findByRole('button', { name: /Generar turnos del mes completo/ }));

    expect(b2bService.generateMonthlyShifts).toHaveBeenCalledWith('court-1');
    expect(await screen.findByRole('status')).toHaveTextContent(/1 turnos nuevos generados/);
  });
});