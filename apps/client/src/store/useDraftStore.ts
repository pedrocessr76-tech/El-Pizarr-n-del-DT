import { create } from 'zustand';
import type { Player, Tournament } from '../../../../packages/shared/types/models';

interface DraftState {
  team: Player[];
  teamId: string | null;
  formation: string;
  captainId: string | null;
  difficulty: string;
  tournament: Tournament | null;
  addPlayerToTeam: (player: Player) => void;
  removePlayerFromTeam: (playerId: string) => void;
  resetTeam: () => void;
  setTeamId: (teamId: string | null) => void;
  setFormation: (formation: string) => void;
  setCaptainId: (captainId: string | null) => void;
  setDifficulty: (difficulty: string) => void;
  setTournament: (tournament: Tournament | null) => void;
  resetAll: () => void;
}

export const useDraftStore = create<DraftState>()((set, get) => ({
  team: [],
  teamId: null,
  formation: '4-3-3',
  captainId: null,
  difficulty: 'Normal',
  tournament: null,
  addPlayerToTeam: (player) => {
    const { team } = get();
    if (team.length >= 18) return;
    set({ team: [...team, player] });
  },
  removePlayerFromTeam: (playerId) => {
    const { team, captainId } = get();
    set({
      team: team.filter((p) => p.id !== playerId),
      captainId: captainId === playerId ? null : captainId,
    });
  },
  resetTeam: () => set({ team: [], captainId: null }),
  setTeamId: (teamId) => set({ teamId }),
  setFormation: (formation) => set({ formation }),
  setCaptainId: (captainId) => set({ captainId }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setTournament: (tournament) => set({ tournament }),
  resetAll: () => set({ team: [], teamId: null, formation: '4-3-3', captainId: null, difficulty: 'Normal', tournament: null }),
}));

