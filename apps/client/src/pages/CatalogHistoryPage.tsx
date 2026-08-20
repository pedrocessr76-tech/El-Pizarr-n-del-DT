import React, { useState, useEffect, useMemo } from 'react';
import { PlayerCard, getRarity } from '../components/PlayerCard';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';
import { useAuthStore } from '../store/useAuthStore';
import type { Player, Position } from '../../../../packages/shared/types/models';
import type { HistoryTournamentItem } from '../services/matchService';

interface CatalogHistoryPageProps {
  initialView?: 'history' | 'catalog';
  onBack?: () => void;
}

export const CatalogHistoryPage: React.FC<CatalogHistoryPageProps> = ({ initialView = 'catalog', onBack }) => {
  const [activeView, setActiveView] = useState<'history' | 'catalog'>(initialView);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Filtros del catálogo ---
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<Position | ''>('');
  const [rarityFilter, setRarityFilter] = useState<string>(''); // 'gold' | 'silver' | 'bronze' | ''
  const [minRating, setMinRating] = useState<number | ''>('');

  // Posiciones presentes en el catálogo (derivadas de los datos reales)
  const positions = useMemo(
    () => Array.from(new Set(players.map((p) => p.position))),
    [players],
  );

  // Opciones de rareza (Calidad)
  const RARITIES: { key: string; label: string; dot: string }[] = [
    { key: '', label: 'Todas', dot: 'bg-outline-variant' },
    { key: 'gold', label: 'Oro', dot: 'bg-[#FFDF00]' },
    { key: 'silver', label: 'Plata', dot: 'bg-[#C0C0C0]' },
    { key: 'bronze', label: 'Bronce', dot: 'bg-[#CD7F32]' },
  ];

  // Lista filtrada del catálogo completo
  const filteredPlayers = useMemo(() => {
    const term = search.toLowerCase().trim();
    return players.filter((p) => {
      const nameMatch = !term || p.name.toLowerCase().includes(term);
      const posMatch = !positionFilter || p.position === positionFilter;
      const rarityMatch = !rarityFilter || getRarity(p.rating ?? 0) === rarityFilter;
      const ratingMatch = minRating === '' || (p.rating ?? 0) >= minRating;
      return nameMatch && posMatch && rarityMatch && ratingMatch;
    });
  }, [players, search, positionFilter, rarityFilter, minRating]);

  const clearFilters = () => {
    setSearch('');
    setPositionFilter('');
    setRarityFilter('');
    setMinRating('');
  };

  // Estado de historial real
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryTournamentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await playerService.getAllPlayers();
        setPlayers(data);
      } catch (err: any) {
        setLoadError(err.response?.data?.message || 'Error al cargar el catálogo de jugadores.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlayers();
  }, []);

  useEffect(() => {
    if (activeView !== 'history') return;
    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      if (!user) {
        setHistory([]);
        setHistoryLoading(false);
        return;
      }
      try {
        const data = await matchService.getHistory(user.id);
        setHistory(data.tournaments);
      } catch (err: any) {
        setHistoryError(err.response?.data?.message || 'Error al cargar el historial.');
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [activeView, user]);

  return (
    <div className="bg-background text-on-background min-h-screen pb-xl flex flex-col relative selection:bg-primary/30 selection:text-primary-fixed">
      {/* Sequential Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-gutter py-md flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Atrás
        </button>

        <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-1.5 rounded-lg text-sm font-headline-sm transition-all ${
              activeView === 'history' ? 'bg-primary-container/30 text-primary border border-primary/30 shadow-md' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveView('catalog')}
            className={`px-4 py-1.5 rounded-lg text-sm font-headline-sm transition-all ${
              activeView === 'catalog' ? 'bg-primary-container/30 text-primary border border-primary/30 shadow-md' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Catálogo
          </button>
        </div>

        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant transition-colors">
          <span className="material-symbols-outlined text-on-surface">tune</span>
        </button>
      </header>

      {/* Screen 3: Match History — dinámico desde backend */}
      {activeView === 'history' && (
        <main className="max-w-5xl mx-auto w-full px-gutter mt-lg flex-1">
          {/* Sin sesión iniciada */}
          {!user && (
            <div className="bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden deep-field-shadow p-xl text-center">
              <div className="flex flex-col items-center gap-4 py-12">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">history</span>
                <p className="font-headline-sm text-headline-sm text-on-surface-variant">
                  Inicia sesión para guardar tu historial de partidas
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant/70">
                  Los torneos que juegues se guardarán automáticamente en tu perfil.
                </p>
              </div>
            </div>
          )}

          {/* Cargando historial */}
          {user && historyLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4 text-on-surface-variant">
                <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="font-body-md text-body-md">Cargando historial...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {user && !historyLoading && historyError && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center text-error">
                <span className="material-symbols-outlined text-[48px] mb-2">error</span>
                <p className="font-body-md text-body-md">{historyError}</p>
              </div>
            </div>
          )}

          {/* Tabla de torneos */}
          {user && !historyLoading && !historyError && (
            <div className="bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden deep-field-shadow">
              <div className="grid grid-cols-6 gap-4 p-md bg-surface-container-high/50 border-b border-white/5 text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                <div className="col-span-1">Fecha</div>
                <div className="col-span-1">Estado</div>
                <div className="col-span-2">Ronda alcanzada</div>
                <div className="col-span-2 text-center">Partidos</div>
              </div>
              <div className="flex flex-col">
                {history.length === 0 ? (
                  <div className="p-md text-center text-on-surface-variant font-body-md text-body-md py-8">
                    {user ? 'Aún no has jugado ningún torneo.' : ''}
                  </div>
                ) : (
                  history.map((t) => (
                    <div
                      key={t.id}
                      className="grid grid-cols-6 gap-4 p-md items-center border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <div className="col-span-1 text-on-surface font-body-md text-body-md opacity-70">
                        {new Date(t.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="col-span-1">
                        <span className={`px-2 py-1 rounded font-label-md text-[10px] uppercase border ${
                          t.status === 'IN_PROGRESS'
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : t.status === 'COMPLETED'
                            ? 'bg-tertiary/20 text-tertiary border-tertiary/30'
                            : 'bg-error/20 text-error border-error/30'
                        }`}>
                          {t.status === 'IN_PROGRESS' ? 'En curso' : t.status === 'COMPLETED' ? 'Completado' : 'Fallido'}
                        </span>
                      </div>
                      <div className="col-span-2 font-headline-sm text-[16px] text-on-surface">
                        {t.currentRound}
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        {t.matches.slice(0, 3).map((m) => (
                          <div key={m.id} className="flex items-center justify-center gap-2 text-xs">
                            <span className="truncate max-w-[80px] text-on-surface-variant">{m.homeTeamName}</span>
                            <span className="font-stat-value text-primary">
                              {m.status === 'FINISHED' ? `${m.homeScore} - ${m.awayScore}` : 'vs'}
                            </span>
                            <span className="truncate max-w-[80px] text-on-surface-variant">{m.awayTeamName}</span>
                          </div>
                        ))}
                        {t.matches.length > 3 && (
                          <span className="text-xs text-on-surface-variant text-center">
                            +{t.matches.length - 3} partidos más
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Screen 4: Card Catalog */}
      {activeView === 'catalog' && (
        <main className="max-w-7xl mx-auto w-full px-gutter mt-lg flex-1">
                    {/* Toolbar: búsqueda, contador y reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-xl">
                      <div className="relative w-full sm:max-w-xl">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar jugador por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-on-background placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-label-md text-label-md text-on-surface-variant">
                {filteredPlayers.length} de {players.length}
                <span className="text-on-surface-variant/60">
                  {' '}
                  (filtrados: {players.length - filteredPlayers.length})
                </span>
              </span>
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-label-md text-label-md transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4 text-on-surface-variant">
                <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="font-body-md text-body-md">Cargando catálogo de jugadores...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && loadError && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center text-error">
                <span className="material-symbols-outlined text-[48px] mb-2">error</span>
                <p className="font-body-md text-body-md">{loadError}</p>
              </div>
            </div>
          )}

                    {/* Filters (only when loaded ok) */}
          {!isLoading && !loadError && (
            <>
              {/* Calidad (rarezas) */}
              <div className="mb-6">
                <span className="font-label-md text-label-md text-on-surface-variant mb-2 block">
                  Calidad
                </span>
                <div className="flex flex-wrap gap-2">
                  {RARITIES.map((r) => (
                    <button
                      key={r.key || 'todas'}
                      onClick={() => setRarityFilter(r.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-label-md transition-all ${
                        rarityFilter === r.key
                          ? 'bg-primary-container/30 text-primary border border-primary/30'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded ${r.dot}`}></span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posición */}
              <div className="mb-6">
                <span className="font-label-md text-label-md text-on-surface-variant mb-2 block">
                  Posición
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPositionFilter('')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-label-md transition-all ${
                      positionFilter === ''
                        ? 'bg-primary-container/30 text-primary border border-primary/30'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
                    }`}
                  >
                    Todas
                  </button>
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-label-md transition-all ${
                        positionFilter === pos
                          ? 'bg-primary-container/30 text-primary border border-primary/30'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
                    }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valoración mínima */}
              <div className="mb-6 max-w-xs">
                <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">
                  Valoración mínima
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={99}
                    step={1}
                    value={minRating === '' ? 0 : minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="font-stat-value text-primary w-12 text-right">
                    {minRating === '' ? '—' : minRating}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Card Grid — fluye con el scroll de página (sin recorte) */}
          {!isLoading && !loadError && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pb-8">
              {filteredPlayers.length === 0 ? (
                <div className="col-span-full text-center py-16 text-on-surface-variant font-body-md text-body-md">
                  No hay jugadores que coincidan con los filtros seleccionados.
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
};