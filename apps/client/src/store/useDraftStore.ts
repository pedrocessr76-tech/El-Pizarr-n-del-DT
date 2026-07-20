import { create } from 'zustand';
import type { Player } from '../../../../packages/shared/types/models';

interface DraftState {
  team: Player[];
  addPlayerToTeam: (player: Player) => void;
  resetTeam: () => void;
}

export const useDraftStore = create<DraftState>((set, get) => ({
  team: [],
  addPlayerToTeam: (player) => {
    const { team } = get();
    if (team.length >= 11) return;
    set({ team: [...team, player] });
  },
  resetTeam: () => set({ team: [] }),
}));
