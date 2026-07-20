import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerCard } from './PlayerCard';
import type { Player } from '../../../../packages/shared/types/models';
import { useDraftStore } from '../store/useDraftStore';

interface PackResponse {
  players: Player[];
}

async function fetchPack(): Promise<Player[]> {
  const response = await axios.get<PackResponse>('http://localhost:3001/draft/pack');
  return response.data.players;
}

export function PackOpener() {
  const [pack, setPack] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const addPlayerToTeam = useDraftStore((state) => state.addPlayerToTeam);

  const openPack = async () => {
    setLoading(true);
    setMessage('Abriendo sobre...');

    try {
      const players = await fetchPack();
      setPack(players);
      console.log('Jugadores recibidos:', players);
      setMessage('Elige un jugador');
    } catch (error) {
      setMessage('No se pudo abrir el sobre');
    } finally {
      setLoading(false);
    }
  };

  const selectPlayer = async (player: Player) => {
    try {
      await axios.post('/draft/select', { playerId: player.id });
      addPlayerToTeam(player);
      setPack([]);
      setMessage(`${player.name} agregado al equipo.`);
    } catch (error) {
      setMessage('No se pudo seleccionar el jugador');
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Abrir sobre</h2>
          <p className="text-sm text-slate-400">Haz clic para recibir 5 jugadores y escoger uno.</p>
        </div>
        <button
          type="button"
          onClick={openPack}
          disabled={loading}
          className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Abriendo...' : 'Abrir sobre'}
        </button>
      </div>

      <p className="text-sm text-slate-300">{message}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {pack.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <PlayerCard player={player} onSelect={selectPlayer} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
