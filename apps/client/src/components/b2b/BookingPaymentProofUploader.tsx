import { useState, type ChangeEvent } from 'react';
import { Check, LoaderCircle, Upload } from 'lucide-react';
import { b2bService, type B2bBooking } from '../../services/b2bService';
import './BookingPaymentProofUploader.css';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function BookingPaymentProofUploader({ bookingId, paymentProof }: {
  bookingId: string;
  paymentProof?: B2bBooking['paymentProof'];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'FULL'>(paymentProof?.paymentType ?? 'DEPOSIT');
  const [paymentMethod, setPaymentMethod] = useState<'MERCADO_PAGO' | 'TRANSFER'>(paymentProof?.paymentMethod ?? 'TRANSFER');
  const [savedProof, setSavedProof] = useState(paymentProof ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError('');
    if (!selected) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(selected.type)) { setError('Usá una imagen JPG, PNG, WebP o un PDF.'); setFile(null); return; }
    if (selected.size > MAX_FILE_BYTES) { setError('El comprobante puede pesar hasta 5 MB.'); setFile(null); return; }
    setFile(selected);
  };

  const upload = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      const proof = await b2bService.uploadBookingPaymentProof(bookingId, {
        paymentType,
        paymentMethod,
        file,
      });
      setSavedProof(proof);
      setFile(null);
    } catch {
      setError('No se pudo guardar el comprobante. Revisá el archivo y volvé a intentar.');
    } finally { setBusy(false); }
  };

  return <details className="booking-proof-uploader">
    <summary>{savedProof ? `Comprobante cargado: ${savedProof.paymentType === 'DEPOSIT' ? 'Seña' : 'Pago completo'}` : 'Agregar comprobante de pago'}</summary>
    <div className="booking-proof-fields">
      <label>¿Qué pagaste?
        <select className="b2b-input" value={paymentType} disabled={busy} onChange={(event) => setPaymentType(event.target.value as 'DEPOSIT' | 'FULL')}>
          <option value="DEPOSIT">Seña (30%)</option><option value="FULL">Pago completo</option>
        </select>
      </label>
      <label>Medio de pago
        <select className="b2b-input" value={paymentMethod} disabled={busy} onChange={(event) => setPaymentMethod(event.target.value as 'MERCADO_PAGO' | 'TRANSFER')}>
          <option value="TRANSFER">Transferencia</option><option value="MERCADO_PAGO">Mercado Pago</option>
        </select>
      </label>
      <label>Archivo del comprobante
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={selectFile} />
      </label>
      {file && <small>{file.name} · {(file.size / 1024).toFixed(0)} KB</small>}
      {error && <small className="booking-proof-error" role="alert">{error}</small>}
      <button type="button" className="secondary-action" disabled={!file || busy} onClick={() => void upload()}>
        {busy ? <LoaderCircle size={15} className="animate-spin" /> : savedProof ? <Check size={15} /> : <Upload size={15} />}
        {busy ? 'Subiendo…' : savedProof ? 'Reemplazar comprobante' : 'Subir comprobante'}
      </button>
    </div>
  </details>;
}