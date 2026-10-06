import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PivotsView } from './PivotsView';
import { b2bService } from '../../services/b2bService';
import { useB2bStore } from '../../store/useB2bStore';

const profile = { userId: 'requester', fullName: 'Ana', email: 'ana@example.com', available: false, role: 'FIELD' as const, positions: ['MC'] };
const pivot = { userId: 'pivot', fullName: 'Bruno', role: 'FIELD' as const, positions: ['MC'], organizationId: 'org-1' };
const booking = {
  id: 'booking-1', courtId: 'court-1', shiftId: 'shift-1', clientUserId: 'requester', status: 'CONFIRMED',
  priceCentsArs: 15000, shiftStartsAt: '2030-01-01T20:00:00.000Z', shiftEndsAt: '2030-01-01T21:00:00.000Z', courtName: 'Cancha Norte',
};

beforeEach(() => {
  vi.spyOn(b2bService, 'getMyPivotProfile').mockResolvedValue(profile);
  vi.spyOn(b2bService, 'getAvailablePivots').mockResolvedValue([pivot]);
  vi.spyOn(b2bService, 'getBookings').mockResolvedValue([booking]);
  vi.spyOn(b2bService, 'contactPivot').mockResolvedValue({ sent: true, conversationId: 'request-1' });
  useB2bStore.setState({ orgTimezone: 'America/Argentina/Buenos_Aires' });
});

describe('PivotsView: solicitudes ligadas a reservas', () => {
  it('envía la solicitud con la reserva seleccionada y abre el chat', async () => {
    const openChat = vi.fn();
    const user = userEvent.setup();
    render(<PivotsView onOpenChat={openChat} />);

    expect(await screen.findByRole('option', { name: /Cancha Norte/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Contactar' }));

    expect(b2bService.contactPivot).toHaveBeenCalledWith('pivot', 'booking-1', undefined);
    expect(openChat).toHaveBeenCalledWith('request-1');
  });

  it('no permite contactar si no existe una reserva futura y dirige a Mis reservas', async () => {
    vi.mocked(b2bService.getBookings).mockResolvedValue([]);
    const openBookings = vi.fn();
    const user = userEvent.setup();
    render(<PivotsView onOpenBookings={openBookings} />);

    expect(await screen.findByText(/Necesitás una reserva futura/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contactar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Ir a Mis reservas' }));

    expect(openBookings).toHaveBeenCalled();
    expect(b2bService.contactPivot).not.toHaveBeenCalled();
  });
});