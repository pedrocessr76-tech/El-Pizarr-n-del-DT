import { create } from 'zustand';
import type { Player, Tournament } from '../../../../packages/shared/types/models';

interface DraftState {
  team: Player[];
  tournament: Tournament | null;
  addPlayerToTeam: (player: Player) => void;
  removePlayerFromTeam: (playerId: string) => void;
  resetTeam: () => void;
  setTournament: (tournament: Tournament | null) => void;
}

export const useDraftStore = create<DraftState>((set, get) => ({
  team: [],
  tournament: null,
  addPlayerToTeam: (player) => {
    const { team } = get();
    if (team.length >= 18) return;
    set({ team: [...team, player] });
  },
  removePlayerFromTeam: (playerId) => {
    const { team } = get();
    set({ team: team.filter((p) => p.id !== playerId) });
  },
  resetTeam: () => set({ team: [] }),
  setTournament: (tournament) => set({ tournament }),
}));
