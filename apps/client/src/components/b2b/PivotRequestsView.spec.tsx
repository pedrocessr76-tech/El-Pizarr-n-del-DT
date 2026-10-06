import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PivotRequestsView } from './PivotRequestsView';
import { b2bService, type B2bPivotRequest } from '../../services/b2bService';

const request: B2bPivotRequest = {
  id: 'request-1', conversationId: 'request-1', bookingId: 'booking-1', status: 'PENDING', respondedAt: null,
  isRequester: false, canRespond: true, requesterName: 'Ana Perez', pivotName: 'Bruno Diaz',
  courtName: 'Cancha Norte', courtSportType: 'FUTBOL 5', shiftStartsAt: '2030-01-01T20:00:00.000Z',
  shiftEndsAt: '2030-01-01T21:00:00.000Z', bookingStatus: 'CONFIRMED', createdAt: '2029-12-01T12:00:00.000Z',
};

beforeEach(() => {
  vi.spyOn(b2bService, 'getPivotRequests').mockResolvedValue([request]);
  vi.spyOn(b2bService, 'respondToPivotRequest').mockResolvedValue({ id: request.id, status: 'ACCEPTED', respondedAt: '2029-12-01T12:00:00.000Z' });
});

describe('PivotRequestsView', () => {
  it('muestra el partido, quién solicitó y permite confirmar asistencia', async () => {
    const openChat = vi.fn();
    const user = userEvent.setup();
    render(<PivotRequestsView onOpenChat={openChat} timezone="America/Argentina/Buenos_Aires" />);

    expect(await screen.findByText(/Ana Perez te solicita/)).toBeInTheDocument();
    expect(screen.getByText(/Cancha Norte/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Voy' }));

    expect(b2bService.respondToPivotRequest).toHaveBeenCalledWith('request-1', 'ACCEPTED');
    await user.click(screen.getByRole('button', { name: 'Abrir chat con Ana Perez' }));
    expect(openChat).toHaveBeenCalledWith('request-1');
  });

  it('muestra el resultado al solicitante sin ofrecerle responder', async () => {
    vi.mocked(b2bService.getPivotRequests).mockResolvedValue([{ ...request, isRequester: true, canRespond: false, status: 'DECLINED' }]);
    render(<PivotRequestsView onOpenChat={vi.fn()} timezone="America/Argentina/Buenos_Aires" />);

    expect(await screen.findByText(/Solicitaste a Bruno Diaz/)).toBeInTheDocument();
    expect(screen.getByText('No puede asistir')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'No voy' })).not.toBeInTheDocument();
  });
});