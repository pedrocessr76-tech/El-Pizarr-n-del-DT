import { useCallback, useEffect, useState } from 'react';
import { Check, LoaderCircle, Search, Shield, UserRound, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isGuestUserId } from '../utils/session';
import { pivotService, type PivotPlayer, type PivotProfile, type PivotRole } from '../services/pivotService';

const POSITIONS = [
  ['POR', 'Arquero'], ['LD', 'Lateral derecho'], ['DFC', 'Defensor central'], ['LI', 'Lateral izquierdo'],
  ['MCD', 'Mediocentro defensivo'], ['MC', 'Mediocentro'], ['MD', 'Volante derecho'], ['MI', 'Volante izquierdo'],
  ['MCO', 'Enganche'], ['ED', 'Extremo derecho'], ['EI', 'Extremo izquierdo'], ['SD', 'Segundo delantero'], ['DC', 'Delantero'],
] as const;

const roleLabels: Record<PivotRole, string> = { GOALKEEPER: 'Arquero', FIELD: 'Jugador de cancha', BOTH: 'Ambos roles' };

export function PivotePage({ onOpenLogin }: { onOpenLogin: () => void }) {
  const user = useAuthStore((state) => state.user);
  const registered = Boolean(user && !isGuestUserId(user.id));
  const [profile, setProfile] = useState<PivotProfile>({ available: false, role: 'FIELD', positions: [] });
  const [players, setPlayers] = useState<PivotPlayer[]>([]);
  const [filterPosition, setFilterPosition] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contacting, setContacting] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!registered) return;
    setLoading(true);
    setError('');
    try {
      const [mine, available] = await Promise.all([pivotService.getMyProfile(), pivotService.list(filterPosition || undefined)]);
      setProfile(mine);
      setPlayers(available);
    } catch (cause: any) {
      setError(cause?.response?.data?.message || 'No pudimos cargar los perfiles pivote.');
    } finally { setLoading(false); }
  }, [registered, filterPosition]);

  useEffect(() => { void load(); }, [load]);

  const save = async (next: PivotProfile) => {
    setSaving(true); setError(''); setSuccess('');
    try { setProfile(await pivotService.updateMyProfile(next)); setSuccess('Tu perfil pivote quedó actualizado.'); await load(); }
    catch (cause: any) { setError(cause?.response?.data?.message || 'No pudimos guardar tus preferencias.'); }
    finally { setSaving(false); }
  };

  const togglePosition = (position: string) => {
    const positions = profile.positions.includes(position)
      ? profile.positions.filter((item) => item !== position)
      : [...profile.positions, position];
    setProfile({ ...profile, positions });
  };

  const sendContact = async (player: PivotPlayer) => {
    setContacting(player.userId); setError(''); setSuccess('');
    try {
      await pivotService.contact(player.userId, contactNote.trim());
      setSuccess(`Solicitud enviada a ${player.username}. Le llegará una notificación en el juego.`);
    } catch (cause: any) { setError(cause?.response?.data?.message || 'No pudimos enviar la solicitud.'); }
    finally { setContacting(''); }
  };

  if (!registered) return <main className="min-h-screen px-4 py-12 md:py-20">
    <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#131b2e] p-8 text-center shadow-2xl">
      <span className="material-symbols-outlined mb-4 text-5xl text-[#a5d0b9]">sports</span>
      <h1 className="font-montserrat text-3xl font-black text-white">Jugador pivote</h1>
      <p className="mx-auto mt-3 max-w-lg text-gray-300">Iniciá sesión o creá tu cuenta del juego para ofrecerte como reemplazo y recibir pedidos de contacto.</p>
      <button type="button" onClick={onOpenLogin} className="mt-6 rounded-xl bg-[#a5d0b9] px-6 py-3 font-bold text-[#0b1326]">Iniciar sesión</button>
    </section>
  </main>;

  return <main className="min-h-screen px-4 py-8 pb-28 md:py-12">
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-3xl border border-[#a5d0b9]/20 bg-gradient-to-br from-[#1b4332] via-[#152c31] to-[#131b2e] p-7 md:p-10">
        <div className="flex items-center gap-3 text-[#a5d0b9]"><Users size={18} /><span className="text-xs font-bold tracking-[.2em]">COMUNIDAD DEL JUEGO</span></div>
        <h1 className="mt-3 font-montserrat text-3xl font-black text-white md:text-5xl">Buscá tu próximo partido</h1>
        <p className="mt-3 max-w-2xl text-gray-300">Ofrecete como pivote cuando un equipo necesita un reemplazo, o contactá jugadores disponibles para completar el plantel.</p>
      </header>

      {(error || success) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-300/30 bg-red-950/30 text-red-200' : 'border-[#a5d0b9]/30 bg-[#1b4332]/40 text-[#bce8cb]'}`}>{error || success}</p>}

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-3xl border border-white/10 bg-[#131b2e] p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3"><UserRound className="text-[#a5d0b9]" /><div><h2 className="font-montserrat text-xl font-bold text-white">Mi perfil pivote</h2><p className="text-sm text-gray-400">Cuenta: {user?.username}</p></div></div>
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <span><strong className="block text-white">Estoy disponible</strong><small className="text-gray-400">Aparecer en las búsquedas de otros equipos</small></span>
            <input aria-label="Estoy disponible como pivote" type="checkbox" checked={profile.available} onChange={(event) => setProfile({ ...profile, available: event.target.checked })} className="h-5 w-5 accent-[#a5d0b9]" />
          </label>

          <fieldset className="mt-6"><legend className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Qué rol podés cubrir</legend>
            <div className="grid gap-2 sm:grid-cols-3">{(['GOALKEEPER', 'FIELD', 'BOTH'] as PivotRole[]).map((role) => <button key={role} type="button" onClick={() => setProfile({ ...profile, role, positions: role === 'GOALKEEPER' ? ['POR'] : profile.positions.filter((position) => position !== 'POR') })} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${profile.role === role ? 'border-[#a5d0b9]/60 bg-[#1b4332] text-[#bce8cb]' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}>{roleLabels[role]}</button>)}</div>
          </fieldset>

          {profile.role !== 'GOALKEEPER' && <fieldset className="mt-6"><legend className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Posiciones favoritas</legend>
            <div className="flex flex-wrap gap-2">{POSITIONS.filter(([key]) => key !== 'POR').map(([key, label]) => { const selected = profile.positions.includes(key); return <button key={key} type="button" aria-pressed={selected} onClick={() => togglePosition(key)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${selected ? 'border-[#a5d0b9]/60 bg-[#1b4332] text-[#bce8cb]' : 'border-white/10 text-gray-400 hover:text-white'}`}>{key} · {label}</button>; })}</div>
          </fieldset>}
          {profile.role !== 'FIELD' && <div className="mt-4 flex items-center gap-2 text-sm text-gray-300"><Shield size={16} className="text-[#a5d0b9]" />También podés cubrir el arco.</div>}
          <button type="button" disabled={saving} onClick={() => void save(profile)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a5d0b9] px-4 py-3 font-bold text-[#0b1326] disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}Guardar perfil</button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#131b2e] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="font-montserrat text-xl font-bold text-white">Pivotes disponibles</h2><p className="mt-1 text-sm text-gray-400">Mandales una solicitud; les llega por notificación.</p></div>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1326] px-3 py-2 text-sm text-gray-300"><Search size={15} /><select value={filterPosition} onChange={(event) => setFilterPosition(event.target.value)} className="bg-transparent outline-none"><option value="">Todas las posiciones</option>{POSITIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          </div>
          <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-gray-400">Mensaje para el jugador <span className="font-normal normal-case">(opcional)</span><textarea maxLength={300} value={contactNote} onChange={(event) => setContactNote(event.target.value)} placeholder="Contale qué puesto necesitan y cuándo juegan…" className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-[#0b1326] p-3 text-sm normal-case text-white placeholder:text-gray-600" /></label>
          <div className="mt-5 space-y-3">
            {loading && <p className="flex items-center gap-2 py-10 text-sm text-gray-400"><LoaderCircle size={16} className="animate-spin" />Buscando jugadores…</p>}
            {!loading && players.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-400">No hay pivotes disponibles para ese filtro todavía.</div>}
            {!loading && players.map((player) => <article key={player.userId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div><strong className="text-white">{player.username}</strong><p className="mt-1 text-xs text-[#a5d0b9]">{roleLabels[player.role]}</p><div className="mt-2 flex flex-wrap gap-1.5">{player.positions.map((position) => <span key={position} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-gray-300">{POSITIONS.find(([key]) => key === position)?.[1] ?? position}</span>)}</div></div>
              <button type="button" disabled={Boolean(contacting)} onClick={() => void sendContact(player)} className="rounded-xl border border-[#a5d0b9]/40 px-4 py-2 text-sm font-bold text-[#bce8cb] hover:bg-[#1b4332] disabled:opacity-50">{contacting === player.userId ? 'Enviando…' : 'Contactar'}</button>
            </article>)}
          </div>
        </section>
      </div>
    </div>
  </main>;
}
