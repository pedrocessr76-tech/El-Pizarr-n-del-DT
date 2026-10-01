import { useEffect, useRef, useState } from 'react';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';
import { useB2bStore } from '../store/useB2bStore';

type Status = 'verifying' | 'success' | 'error';

/**
 * Destino del enlace de verificación de email (#verificacion-de-email).
 *
 * El enlace es un GET, así que esta pantalla es la que canjea el token. No pide
 * sesión a propósito: confirmar el correo no debería requerir haber entrado, y
 * exigirlo dejaría trabado al usuario nuevo justo en el paso que lo activa.
 *
 * El token viene en la query y se borra de la URL al terminar: si queda en el
 * historial o en un `<img>` de otra pestaña, alguien más podría canjearlo.
 */
export function B2bEmailVerification() {
  const verifyEmail = useB2bStore((state) => state.verifyEmail);
  const resendVerification = useB2bStore((state) => state.resendVerification);
  const pendingEmail = useB2bStore((state) => state.pendingVerificationEmail);

  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Confirmando tu email…');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  // Llegar por el enlace no garantiza que el store tenga el email (otra pestaña,
  // otro dispositivo): si no lo tiene, se lo pide a la persona.
  const [email, setEmail] = useState(pendingEmail ?? '');
  // Sólo un intento: un doble montaje (React StrictMode) no debe gastar el
  // token de un solo uso y dejar al usuario con un error falso.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const token = new URLSearchParams(window.location.search).get('token') ?? '';
    if (!token) {
      setStatus('error');
      setMessage('El enlace no tiene token. Pedí uno nuevo desde la pantalla de acceso.');
      return;
    }

    verifyEmail(token)
      .then((result) => {
        setStatus(result.ok ? 'success' : 'error');
        setMessage(result.message);
      })
      .catch(() => {
        setStatus('error');
        setMessage('No pudimos confirmar el enlace. Pedí uno nuevo.');
      })
      // El token es de un solo uso: sacarlo de la URL evita canjearlo dos veces
      // desde el botón "atrás" del navegador.
      .finally(() => window.history.replaceState({}, '', '/canchas/verificar-email'));
  }, [verifyEmail]);

  const resend = async () => {
    if (!email.trim()) return;
    setResendState('sending');
    const result = await resendVerification(email.trim());
    setResendState('sent');
    if (!result.ok) setMessage(result.message);
  };

  return (
    <div className="b2b-app">
      <main className="b2b-main" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div
          style={{
            width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16,
            border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.08)',
            padding: 32, textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: status === 'success' ? '#dcfce7' : status === 'error' ? '#fee2e2' : '#f1f5f9',
              color: status === 'success' ? '#15803d' : status === 'error' ? '#b91c1c' : '#64748b',
            }}
          >
            {status === 'verifying'
              ? <Loader2 size={26} style={{ animation: 'spin 0.8s linear infinite' }} />
              : status === 'success'
                ? <MailCheck size={26} />
                : <RefreshCw size={26} />}
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: 20, color: '#0f172a' }}>
            {status === 'verifying' && 'Confirmando tu email'}
            {status === 'success' && '¡Email verificado!'}
            {status === 'error' && 'No pudimos verificar'}
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.5 }}>{message}</p>

          {status === 'success' && (
            <button
              type="button"
              onClick={() => { window.location.href = '/canchas'; }}
              style={{
                marginTop: 24, width: '100%', padding: '12px 16px', border: 0, borderRadius: 10,
                background: '#15803d', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}
            >
              Ir al Sistema Canchas
            </button>
          )}

          {status === 'error' && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{
                  marginTop: 24, width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                  border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 15, color: '#0f172a',
                }}
              />
              <button
                type="button"
                onClick={() => { void resend(); }}
                disabled={resendState !== 'idle' || !email.trim()}
                style={{
                  marginTop: 10, width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: 10,
                  background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 15,
                  cursor: resendState !== 'idle' || !email.trim() ? 'not-allowed' : 'pointer',
                  opacity: resendState !== 'idle' || !email.trim() ? 0.6 : 1,
                }}
              >
                {resendState === 'sending' ? 'Reenviando…' : 'Reenviar el enlace'}
              </button>
            </>
          )}

          {resendState === 'sent' && status === 'error' && (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#64748b' }}>
              Si esa cuenta existe y falta verificar, te llega un enlace nuevo. Revisá la carpeta de spam.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}