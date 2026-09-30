import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingAlertsPanel } from './PendingAlertsPanel';
import { b2bService, B2bPendingWhatsAppAlert } from '../../services/b2bService';

const alert = (overrides: Partial<B2bPendingWhatsAppAlert> = {}): B2bPendingWhatsAppAlert => ({
  reminderId: 'rem-1',
  bookingId: 'b1',
  clientName: 'Ana Perez',
  phone: '+54 9 11 5555-1234',
  courtName: 'Cancha 1',
  startsAt: '2026-03-10T15:20:00.000Z',
  dateLabel: '10/03/2026',
  timeLabel: '12:20',
  minutesBefore: 30,
  body: 'Hola Ana Perez, te recordamos tu turno en Cancha 1 el 10/03/2026 a las 12:20.',
  ...overrides,
});

const getAlerts = vi.fn();
const markDispatched = vi.fn();

beforeEach(() => {
  getAlerts.mockReset();
  markDispatched.mockReset();
  vi.spyOn(b2bService, 'getPendingWhatsAppAlerts').mockImplementation(getAlerts);
  vi.spyOn(b2bService, 'markWhatsAppAlertDispatched').mockImplementation(markDispatched);
});

describe('PendingAlertsPanel (#34)', () => {
  it('avisa cuando no hay avisos pendientes', async () => {
    getAlerts.mockResolvedValue([]);
    render(<PendingAlertsPanel />);

    expect(await screen.findByText(/No hay avisos pendientes/)).toBeInTheDocument();
  });

  it('lista el aviso con el mensaje listo para mandar', async () => {
    getAlerts.mockResolvedValue([alert()]);
    render(<PendingAlertsPanel />);

    expect(await screen.findByText('Ana Perez')).toBeInTheDocument();
    expect(screen.getByText(/Cancha 1 · 10\/03\/2026 12:20/)).toBeInTheDocument();
    expect(screen.getByText(alert().body)).toBeInTheDocument();
  });

  it('enlaza al chat de WhatsApp con el mensaje precargado', async () => {
    getAlerts.mockResolvedValue([alert()]);
    render(<PendingAlertsPanel />);

    const link = await screen.findByRole('link', { name: /Mandar por WhatsApp/ });
    // Solo dígitos, en E.164, con el mensaje precargado.
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5491155551234?text='));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('saca el aviso de la lista cuando el personal confirma el despacho', async () => {
    getAlerts.mockResolvedValue([alert()]);
    markDispatched.mockResolvedValue({ dispatched: true });
    render(<PendingAlertsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: /Ya lo mandé/ }));

    expect(markDispatched).toHaveBeenCalledWith('rem-1');
    await waitFor(() => expect(screen.queryByText('Ana Perez')).not.toBeInTheDocument());
  });

  it('mantiene el aviso y avisa si la confirmación falla', async () => {
    getAlerts.mockResolvedValue([alert()]);
    markDispatched.mockRejectedValue(new Error('boom'));
    render(<PendingAlertsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: /Ya lo mandé/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo confirmar el despacho/);
    expect(screen.getByText('Ana Perez')).toBeInTheDocument();
  });

  it('avisa si no puede cargar los avisos', async () => {
    getAlerts.mockRejectedValue(new Error('boom'));
    render(<PendingAlertsPanel />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudieron cargar los avisos/);
  });

  it('vuelve a consultar los avisos a pedido del usuario', async () => {
    getAlerts.mockResolvedValue([alert()]);
    render(<PendingAlertsPanel />);

    await screen.findByText('Ana Perez');
    await userEvent.click(screen.getByRole('button', { name: /Actualizar/ }));

    await waitFor(() => expect(getAlerts).toHaveBeenCalledTimes(2));
  });

  it('copia teléfono y texto cuando el enlace no sirve', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    getAlerts.mockResolvedValue([alert()]);
    render(<PendingAlertsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: /Copiar/ }));

    expect(writeText).toHaveBeenCalledWith(`${alert().phone}\n${alert().body}`);
    expect(await screen.findByRole('button', { name: /Copiado/ })).toBeDisabled();
  });

  it('avisa si el portapapeles no está disponible', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('sin permiso')) } });
    getAlerts.mockResolvedValue([alert()]);
    render(<PendingAlertsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: /Copiar/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo copiar/);
  });
});
