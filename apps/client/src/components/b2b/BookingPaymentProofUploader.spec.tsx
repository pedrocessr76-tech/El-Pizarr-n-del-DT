import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingPaymentProofUploader } from './BookingPaymentProofUploader';
import { b2bService } from '../../services/b2bService';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(b2bService, 'uploadBookingPaymentProof').mockImplementation(async (_id, input) => ({
    paymentType: input.paymentType, paymentMethod: input.paymentMethod, fileName: input.file.name,
    contentType: input.file.type, uploadedAt: '2030-01-01T12:00:00.000Z',
  }));
});

describe('BookingPaymentProofUploader', () => {
  it('permite elegir modalidad/medio y subir la imagen de una reserva', async () => {
    const user = userEvent.setup();
    render(<BookingPaymentProofUploader bookingId="booking-1" />);
    await user.click(screen.getByText('Agregar comprobante de pago'));
    await user.selectOptions(screen.getByLabelText('¿Qué pagaste?'), 'FULL');
    await user.selectOptions(screen.getByLabelText('Medio de pago'), 'MERCADO_PAGO');
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'recibo.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Archivo del comprobante'), file);
    await user.click(screen.getByRole('button', { name: 'Subir comprobante' }));

    expect(b2bService.uploadBookingPaymentProof).toHaveBeenCalledWith('booking-1', {
      paymentType: 'FULL', paymentMethod: 'MERCADO_PAGO', file,
    });
    expect(await screen.findByText('Comprobante cargado: Pago completo')).toBeInTheDocument();
  });

  it('rechaza un formato no admitido en el cliente', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<BookingPaymentProofUploader bookingId="booking-1" />);
    await user.click(screen.getByText('Agregar comprobante de pago'));
    await user.upload(screen.getByLabelText('Archivo del comprobante'), new File(['script'], 'archivo.svg', { type: 'image/svg+xml' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPG, PNG, WebP o un PDF/);
    expect(b2bService.uploadBookingPaymentProof).not.toHaveBeenCalled();
  });
});