import { beforeEach, describe, expect, it } from 'vitest';
import { useDraftStore } from './useDraftStore';
import type { Player } from '../../../../packages/shared/types/models';

const makePlayer = (id: string): Player => ({
  id,
  name: `Jugador ${id}`,
  nationality: 'AR',
  position: 'FWD',
  stats: { pace: 80, shooting: 75, passing: 70, dribbling: 78, defending: 40, physical: 70 },
});

const DEFAULT_STATE = {
  team: [] as Player[],
  teamId: null,
  formation: '4-3-3',
  captainId: null,
  difficulty: 'Normal',
  tournament: null,
};

beforeEach(() => {
  useDraftStore.setState(DEFAULT_STATE);
});

describe('useDraftStore', () => {
  it('addPlayerToTeam agrega jugadores que no existan y respeta el tope de 18', () => {
    const store = useDraftStore.getState();

    for (let i = 1; i <= 18; i++) store.addPlayerToTeam(makePlayer(`p${i}`));
    useDraftStore.getState().addPlayerToTeam(makePlayer('p19'));

    const { team } = useDraftStore.getState();
    expect(team).toHaveLength(18);
    expect(team.some((p) => p.id === 'p19')).toBe(false);
  });

  it('removePlayerFromTeam quita al jugador y limpia capitanía si coincide', () => {
    const store = useDraftStore.getState();
    store.addPlayerToTeam(makePlayer('p1'));
    store.addPlayerToTeam(makePlayer('p2'));
    store.setCaptainId('p1');

    useDraftStore.getState().removePlayerFromTeam('p1');

    const { team, captainId } = useDraftStore.getState();
    expect(team.map((p) => p.id)).toEqual(['p2']);
    expect(captainId).toBeNull();
  });

  it('removePlayerFromTeam no toca la capitanía de otro jugador', () => {
    const store = useDraftStore.getState();
    store.addPlayerToTeam(makePlayer('p1'));
    store.addPlayerToTeam(makePlayer('p2'));
    store.setCaptainId('p2');

    useDraftStore.getState().removePlayerFromTeam('p1');

    expect(useDraftStore.getState().captainId).toBe('p2');
  });

  it('resetTeam vacía el equipo y la capitanía pero conserva teamId', () => {
    const store = useDraftStore.getState();
    store.addPlayerToTeam(makePlayer('p1'));
    store.setCaptainId('p1');
    store.setTeamId('team-abc');
    store.setFormation('4-4-2');
    store.setDifficulty('Difícil');

    useDraftStore.getState().resetTeam();

    expect(useDraftStore.getState().team).toHaveLength(0);
    expect(useDraftStore.getState().captainId).toBeNull();
    expect(useDraftStore.getState().teamId).toBe('team-abc');
    expect(useDraftStore.getState().formation).toBe('4-4-2');
  });

  it('resetAll vuelve al estado por defecto completo', () => {
    const store = useDraftStore.getState();
    store.addPlayerToTeam(makePlayer('p1'));
    store.setTeamId('team-abc');
    store.setCaptainId('p1');
    store.setFormation('4-2-3-1');
    store.setDifficulty('Imposible');

    useDraftStore.getState().resetAll();

    for (const [key, value] of Object.entries(DEFAULT_STATE)) {
      expect(useDraftStore.getState()[key as keyof typeof DEFAULT_STATE]).toEqual(value);
    }
  });

  it('setTeamId nulo es usado para descartar el equipo de invitado al iniciar sesión', () => {
    useDraftStore.getState().setTeamId('team-abc');
    useDraftStore.getState().setTeamId(null);

    expect(useDraftStore.getState().teamId).toBeNull();
  });
});