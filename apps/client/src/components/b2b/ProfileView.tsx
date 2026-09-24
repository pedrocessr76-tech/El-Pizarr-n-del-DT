import { useEffect, useState } from 'react';
import { ArrowLeft, CircleDollarSign, Phone, ShieldCheck } from 'lucide-react';
import { b2bService, type B2bUser } from '../../services/b2bService';

/**
 * Perfil y contacto de WhatsApp (#37): consulta el perfil desde la BD (no del
 * JWT) y permite cargar/actualizar el teléfono E.164 y el consentimiento de
 * envío. El staff con acceso de administración gestiona además el contacto de
 * su organización. Vaciar el teléfono desactiva el opt-in (lo garantiza el
 * backend vía phone.ts).
 */
export function ProfileView({ role, onBack }: { role: 'staff' | 'client'; onBack?: () => void }) {
  const [profile, setProfile] = useState<B2bUser | null>(null);
  const [orgPhone, setOrgPhone] = useState('');
  const [orgOptIn, setOrgOptIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [orgFeedback, setOrgFeedback] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([b2bService.getProfile(), b2bService.getOrganization()])
      .then(([loadedProfile, loadedOrg]) => {
        if (!active) return;
        setProfile(loadedProfile);
        setPhone(loadedProfile.whatsappPhone ?? '');
        setOptIn(loadedProfile.whatsappOptIn ?? false);
        if (role === 'staff') {
          setOrgPhone(loadedOrg.whatsappPhone ?? '');
          setOrgOptIn(loadedOrg.whatsappOptIn ?? false);
        }
      })
      .catch(() => { if (active) setUserFeedback('No se pudo cargar tu perfil.'); });
    return () => { active = false; };
  }, [role]);

  const saveUserContact = async () => {
    setSavingUser(true);
    setUserFeedback('');
    try {
      const updated = await b2bService.updateProfile({ whatsappPhone: phone.trim(), whatsappOptIn: optIn });
      setProfile(updated);
      setPhone(updated.whatsappPhone ?? '');
      setOptIn(updated.whatsappOptIn ?? optIn);
      setUserFeedback('Contacto de WhatsApp actualizado.');
    } catch (error: any) {
      const reason = error?.response?.data?.message;
      setUserFeedback(typeof reason === 'string' && reason ? reason : 'No se pudo guardar. Verificá el número (formato internacional).');
    } finally {
      setSavingUser(false);
    }
  };

  const saveOrgContact = async () => {
    setSavingOrg(true);
    setOrgFeedback('');
    try {
      const updated = await b2bService.updateOrganizationContact({ whatsappPhone: orgPhone.trim(), whatsappOptIn: orgOptIn });
      setOrgPhone(updated.whatsappPhone ?? '');
      setOrgOptIn(updated.whatsappOptIn);
      setOrgFeedback('Contacto de WhatsApp del complejo actualizado.');
    } catch (error: any) {
      const reason = error?.response?.data?.message;
      setOrgFeedback(typeof reason === 'string' && reason ? reason : 'No se pudo guardar el contacto del complejo.');
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="b2b-content client-content">
      {onBack && (
        <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Volver</button>
      )}
      <div className="b2b-page-heading compact">
        <div>
          <span className="eyebrow"><i /> MI CUENTA</span>
          <h1>Perfil y contacto</h1>
          <p>Manejá tu cuenta y autorizá los avisos por WhatsApp.</p>
        </div>
      </div>

      <div className="payment-layout">
        <section className="panel settings-panel">
          <div className="settings-panel-head">
            <div>
              <h2>Tu cuenta</h2>
              <small>{profile?.email ?? 'Cargando perfil…'}</small>
            </div>
            <span className="settings-icon"><ShieldCheck size={18} /></span>
          </div>
          <div className="selector-block">
            <label className="field-label">Teléfono de WhatsApp</label>
            <div className="inline-form">
              <Phone size={16} className="form-icon" />
              <input
                className="b2b-input"
                type="tel"
                placeholder="Ej: +5491112345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>
            <p className="muted">Formato internacional E.164 (incluye código de país). Dejalo vacío para desactivar los avisos.</p>
          </div>
          <label className="wa-optin-row">
            <input type="checkbox" checked={optIn} onChange={(event) => setOptIn(event.target.checked)} />
            <span>Autorizo a recibir recordatorios y confirmaciones por WhatsApp.</span>
          </label>
          {userFeedback && <p className="settings-feedback">{userFeedback}</p>}
          <div className="settings-panel-actions">
            <button className="primary-action" onClick={() => void saveUserContact()} disabled={savingUser}>
              {savingUser ? 'Guardando…' : 'Guardar mi contacto'}
            </button>
          </div>
        </section>

        {role === 'staff' && (
          <section className="panel settings-panel">
            <div className="settings-panel-head">
              <div>
                <h2>Contacto del complejo</h2>
                <small>El número que recibe los avisos de la organización.</small>
              </div>
              <span className="settings-icon"><CircleDollarSign size={18} /></span>
            </div>
            <div className="selector-block">
              <label className="field-label">WhatsApp del complejo</label>
              <input
                className="b2b-input"
                type="tel"
                placeholder="Ej: +5491112340000"
                value={orgPhone}
                onChange={(event) => setOrgPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>
            <label className="wa-optin-row">
              <input type="checkbox" checked={orgOptIn} onChange={(event) => setOrgOptIn(event.target.checked)} />
              <span>Autorizo al complejo a recibir resúmenes y avisos por WhatsApp.</span>
            </label>
            {orgFeedback && <p className="settings-feedback">{orgFeedback}</p>}
            <div className="settings-panel-actions">
              <button className="secondary-action" onClick={() => void saveOrgContact()} disabled={savingOrg}>
                {savingOrg ? 'Guardando…' : 'Guardar contacto del complejo'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}