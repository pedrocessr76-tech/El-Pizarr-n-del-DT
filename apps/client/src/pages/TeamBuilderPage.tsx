import React, { useState, useEffect } from 'react';
import type { Player } from '../../../../packages/shared/types/models';
import { draftService } from '../services/draftService';
import { useAuthStore } from '../store/useAuthStore';
import { useDraftStore } from '../store/useDraftStore';
import { PlayerMiniCard } from '../components/PlayerCard';
import type { ActiveTab } from '../components/Navbar';

interface TeamBuilderPageProps {
  onBack?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

interface SlotAssignment {
  slotId: string;
  player: Player;
}

type Difficulty = 'Principiante' | 'Profesional' | 'Leyenda';

const DIFFICULTY_MULTIPLIER: Record<Difficulty, string> = {
  Principiante: '1.0x',
  Profesional: '1.5x',
  Leyenda: '2.0x',
};

// Nomenclatura FIFA estándar
export type FIFA_POSITION = 
  | 'POR'      // Portero
  | 'LD'       // Lateral Derecho
  | 'LI'       // Lateral Izquierdo
  | 'DFC'      // Defensa Central
  | 'MCD'      // Mediocentro Defensivo
  | 'MC'       // Mediocentro
  | 'MCO'      // Mediocentro Ofensivo
  | 'MD'       // Medio Derecho
  | 'MI'       // Medio Izquierdo
  | 'ED'       // Extremo Derecho
  | 'EI'       // Extremo Izquierdo
  | 'SD'       // Segundo Delantero
  | 'DC'       // Delantero Centro
  | 'ST';      // Striker (alternativa DC)

// Sistema de equivalencias de posiciones
const POSITION_COMPATIBILITY: Record<FIFA_POSITION, FIFA_POSITION[]> = {
  'POR': ['POR'],
  'LD': ['LD', 'DFC'],
  'LI': ['LI', 'DFC'],
  'DFC': ['DFC', 'LD', 'LI'],
  'MCD': ['MCD', 'MC', 'MCO'],
  'MC': ['MC', 'MCD', 'MCO'],
  'MCO': ['MCO', 'MC', 'MCD'],
  'MD': ['MD', 'ED', 'MC'],
  'MI': ['MI', 'EI', 'MC'],
  'ED': ['ED', 'MD', 'EI', 'SD'],
  'EI': ['EI', 'MI', 'ED', 'SD'],
  'SD': ['SD', 'DC', 'ST', 'ED', 'EI'],
  'DC': ['DC', 'ST', 'SD'],
  'ST': ['ST', 'DC', 'SD'],
};

// Mapeo de posiciones genéricas a posiciones FIFA específicas que pueden jugar
const GENERIC_TO_FIFA: Record<string, FIFA_POSITION[]> = {
  'GK': ['POR'],
  'DEF': ['DFC', 'LD', 'LI'],
  'MID': ['MC', 'MCD', 'MCO', 'MD', 'MI'],
  'FWD': ['DC', 'ST', 'SD', 'ED', 'EI'],
};

// Rating general de un jugador: usa el OVR real (player.rating) cuando está definido;
// de lo contrario, lo estima como promedio de las 6 stats.
const calcPlayerRating = (p: Player): number => {
  if (typeof p.rating === 'number' && p.rating > 0) return Math.round(p.rating);
  return Math.round(
    (p.stats.pace + p.stats.shooting + p.stats.passing +
     p.stats.dribbling + p.stats.defending + p.stats.physical) / 6
  );
};

// Zona a la que pertenece cada posición FIFA
type TeamZone = 'DEF' | 'MID' | 'ATT';
const ZONE_BY_POSITION: Record<FIFA_POSITION, TeamZone> = {
  'POR': 'DEF', // el arquero se cuenta dentro de la defensa
  'LD': 'DEF',
  'LI': 'DEF',
  'DFC': 'DEF',
  'MCD': 'MID',
  'MC': 'MID',
  'MCO': 'MID',
  'MD': 'MID',
  'MI': 'MID',
  'ED': 'ATT',
  'EI': 'ATT',
  'SD': 'ATT',
  'DC': 'ATT',
  'ST': 'ATT',
};

// Función para verificar compatibilidad de posiciones
const arePositionsCompatible = (slotPosition: FIFA_POSITION, playerPosition: string): boolean => {
  const normalizedPlayerPosition = playerPosition.toUpperCase().trim();
  
  // Verificar si la posición del jugador es una posición FIFA específica
  const fifaPositions: FIFA_POSITION[] = [
    'POR', 'LD', 'LI', 'DFC', 'MCD', 'MC', 'MCO', 'MD', 'MI', 'ED', 'EI', 'SD', 'DC', 'ST'
  ];
  
  let playerFIFAPositions: FIFA_POSITION[];
  
  if (fifaPositions.includes(normalizedPlayerPosition as FIFA_POSITION)) {
    // Si ya es una posición FIFA, usarla directamente
    playerFIFAPositions = [normalizedPlayerPosition as FIFA_POSITION];
  } else {
    // Si es una posición genérica, mapearla
    playerFIFAPositions = GENERIC_TO_FIFA[normalizedPlayerPosition] || [];
  }
  
  // Si el jugador no tiene posiciones FIFA mapeadas, no es compatible
  if (playerFIFAPositions.length === 0) {
    return false;
  }
  
  // Verificar si alguna de las posiciones FIFA del jugador es compatible con el slot
  const compatiblePositions = POSITION_COMPATIBILITY[slotPosition] || [slotPosition];
  return playerFIFAPositions.some(pos => compatiblePositions.includes(pos));
};

// Re-asigna jugadores a las casillas de una alineación de forma automática.
// Prioriza colocar a cada jugador en una posición compatible; si no hay casilla
// compatible, lo coloca en la primera casilla libre.
const autoAssignPlayers = (
  players: Player[],
  slots: Array<{ id: string; position: FIFA_POSITION; type: 'starter' | 'substitute' }>,
): SlotAssignment[] => {
  const zoneRank = (pos: FIFA_POSITION): number => {
    if (pos === 'POR') return 0;
    if (['LD', 'LI', 'DFC'].includes(pos)) return 1;
    if (['MCD', 'MC', 'MCO', 'MD', 'MI'].includes(pos)) return 2;
    return 3; // Delanteros
  };

  // Orden por zonas para llenar primero posiciones "naturales"
  const sortedSlots = [...slots].sort((a, b) => zoneRank(a.position) - zoneRank(b.position));
  const assigned: Array<Player | null> = sortedSlots.map(() => null);

  // 1ª pasada: casilla compatible
  for (const player of players) {
    const idx = sortedSlots.findIndex(
      (s, i) => assigned[i] === null && arePositionsCompatible(s.position, player.position),
    );
    if (idx !== -1) assigned[idx] = player;
  }

  // 2ª pasada: si no encontró casilla compatible, ir a una casilla libre
  for (const player of players) {
    if (assigned.includes(player)) continue;
    const idx = assigned.findIndex(a => a === null);
    if (idx !== -1) assigned[idx] = player;
  }

  return sortedSlots
    .map((s, i) => (assigned[i] ? { slotId: s.id, player: assigned[i] as Player } : null))
    .filter((x): x is SlotAssignment => x !== null);
};

// Definición de las 15 alineaciones FIFA
interface Formation {
  name: string;
  slots: Array<{ id: string; position: FIFA_POSITION; type: 'starter' | 'substitute' }>;
}

const FORMATIONS: Record<string, Formation> = {
  '4-3-3 (Plana)': {
    name: '4-3-3 (Plana)',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cm3', position: 'MC', type: 'starter' },
      { id: 'slot-lw', position: 'EI', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-rw', position: 'ED', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-3-3 (Falso 9)': {
    name: '4-3-3 (Falso 9)',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cm1', position: 'MCD', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cm3', position: 'MCO', type: 'starter' },
      { id: 'slot-lw', position: 'EI', type: 'starter' },
      { id: 'slot-st', position: 'SD', type: 'starter' },
      { id: 'slot-rw', position: 'ED', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'SD', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-3-3 (Defensiva)': {
    name: '4-3-3 (Defensiva)',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cm1', position: 'MCD', type: 'starter' },
      { id: 'slot-cm2', position: 'MCD', type: 'starter' },
      { id: 'slot-cm3', position: 'MC', type: 'starter' },
      { id: 'slot-lw', position: 'EI', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-rw', position: 'ED', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-3-3 (Ofensiva)': {
    name: '4-3-3 (Ofensiva)',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cm3', position: 'MCO', type: 'starter' },
      { id: 'slot-lw', position: 'EI', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-rw', position: 'ED', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-4-2 (Plana)': {
    name: '4-4-2 (Plana)',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-st2', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-4-2 (Diamante)': {
    name: '4-4-2 (Diamante)',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MCD', type: 'starter' },
      { id: 'slot-cm2', position: 'MCO', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-st2', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cdm1', position: 'MCD', type: 'starter' },
      { id: 'slot-cdm2', position: 'MCD', type: 'starter' },
      { id: 'slot-lam', position: 'MI', type: 'starter' },
      { id: 'slot-cam', position: 'MCO', type: 'starter' },
      { id: 'slot-ram', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-5-1': {
    name: '4-5-1',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cm3', position: 'MC', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-1-2-1-2': {
    name: '4-1-2-1-2',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cdm', position: 'MCD', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cam', position: 'MCO', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-st2', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-cb3', position: 'DFC', type: 'starter' },
      { id: 'slot-lwb', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cm3', position: 'MC', type: 'starter' },
      { id: 'slot-rwb', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-st2', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-cb3', position: 'DFC', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-lw', position: 'EI', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-rw', position: 'ED', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-cb3', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-cm3', position: 'MC', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'slot-st2', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '5-4-1': {
    name: '5-4-1',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-cb3', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-lb', position: 'LI', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-rb', position: 'LD', type: 'starter' },
      { id: 'slot-cdm', position: 'MCD', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
  '3-4-2-1': {
    name: '3-4-2-1',
    slots: [
      { id: 'slot-gk', position: 'POR', type: 'starter' },
      { id: 'slot-cb1', position: 'DFC', type: 'starter' },
      { id: 'slot-cb2', position: 'DFC', type: 'starter' },
      { id: 'slot-cb3', position: 'DFC', type: 'starter' },
      { id: 'slot-lm', position: 'MI', type: 'starter' },
      { id: 'slot-cm1', position: 'MC', type: 'starter' },
      { id: 'slot-cm2', position: 'MC', type: 'starter' },
      { id: 'slot-rm', position: 'MD', type: 'starter' },
      { id: 'slot-cam1', position: 'MCO', type: 'starter' },
      { id: 'slot-cam2', position: 'MCO', type: 'starter' },
      { id: 'slot-st', position: 'DC', type: 'starter' },
      { id: 'sub-1', position: 'POR', type: 'substitute' },
      { id: 'sub-2', position: 'DFC', type: 'substitute' },
      { id: 'sub-3', position: 'MC', type: 'substitute' },
      { id: 'sub-4', position: 'ED', type: 'substitute' },
      { id: 'sub-5', position: 'DC', type: 'substitute' },
      { id: 'sub-6', position: 'MC', type: 'substitute' },
      { id: 'sub-7', position: 'DFC', type: 'substitute' },
    ]
  },
};

export const TeamBuilderPage: React.FC<TeamBuilderPageProps> = ({ onNavigate }) => {
  const [activeFormation, setActiveFormation] = useState<string>('4-3-3 (Plana)');
  const [showPlayerOverlay, setShowPlayerOverlay] = useState<boolean>(false);
  const [showMatchPrepOverlay, setShowMatchPrepOverlay] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Profesional');
  const [packPlayers, setPackPlayers] = useState<Player[]>([]);
  const [isLoadingPack, setIsLoadingPack] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<FIFA_POSITION | 'ANY'>('ANY');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [assignedPlayers, setAssignedPlayers] = useState<SlotAssignment[]>([]);
  // Casilla cuyo jugador está seleccionado para mover/intercambiar
  const [relocatingSlotId, setRelocatingSlotId] = useState<string | null>(null);
  const { teamId } = useDraftStore();

  const currentFormation = FORMATIONS[activeFormation] || FORMATIONS['4-3-3 (Plana)'];

  useEffect(() => {
    if (showPlayerOverlay && packPlayers.length === 0) {
      loadPack();
    }
  }, [showPlayerOverlay]);

  useEffect(() => {
    // Al montar el builder iniciar siempre con un equipo fresco. El store global
    // (zustand) persiste entre navegaciones, así que leemos valores frescos con
    // getState() para evitar usar un teamId obsoleto (closure). Se crea un equipo
    // nuevo en backend para que el usuario pueda armar desde cero y no aparezca
    // "equipo completo" tras una partida anterior.
    useDraftStore.getState().resetAll();
    setAssignedPlayers([]);
    setRelocatingSlotId(null);
    setMessage(null);

    void (async () => {
      try {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const response = await draftService.createTeam(currentUser.id);
          useDraftStore.getState().setTeamId(response.teamId);
          // Vaciar el equipo persistido para poder armarlo de cero tras una partida.
          await draftService.resetTeam(response.teamId);
        } else {
          const { getOrCreateGuestSessionId, setGuestTeamId } = await import('../utils/session');
          const sessionId = getOrCreateGuestSessionId();
          const response = await draftService.createTeam(undefined, sessionId);
          useDraftStore.getState().setTeamId(response.teamId);
          setGuestTeamId(response.teamId);
          await draftService.resetTeam(response.teamId);
        }
      } catch (err) {
        console.error('Error creando equipo:', err);
      }
    })();
  }, []);

  const loadPack = async () => {
    setIsLoadingPack(true);
    setMessage(null);
    try {
      const position = selectedPosition === 'ANY' ? undefined : selectedPosition;
      const data = await draftService.getPack(position);
      setPackPlayers(data.players);
    } catch (err) {
      setMessage('Error al cargar el sobre de jugadores. Verifica que el backend esté corriendo.');
    } finally {
      setIsLoadingPack(false);
    }
  };

  const handleSelectPlayer = async (player: Player) => {
    if (!teamId) {
      setMessage('Primero debes crear un equipo.');
      return;
    }
    
    // Verificar si el jugador ya está asignado a otro slot
    const isAlreadyAssigned = assignedPlayers.some(ap => ap.player.id === player.id);
    if (isAlreadyAssigned) {
      setMessage('Este jugador ya está asignado en el equipo.');
      return;
    }
    
    setMessage(null);
    try {
      // Determinar si el slot seleccionado es titular o suplente
      const slot = currentFormation.slots.find(s => s.id === selectedSlotId);
      const isStarter = slot?.type === 'starter';

      await draftService.addPlayerToTeam(teamId, player.id, isStarter);
      setAssignedPlayers(prev => {
        const filtered = prev.filter(p => p.slotId !== selectedSlotId);
        return [...filtered, { slotId: selectedSlotId, player }];
      });
      setShowPlayerOverlay(false);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al agregar jugador.');
    }
  };

  const doRelocatePlayer = async (fromSlotId: string, toSlotId: string) => {
    const fromPlayer = getPlayerForSlot(fromSlotId);
    const toPlayer = getPlayerForSlot(toSlotId);
    if (!fromPlayer) return;

    setAssignedPlayers(prev => {
      if (toPlayer) {
        // Intercambiar: el jugador destino ocupa la casilla de origen
        return prev.map(p =>
          p.slotId === fromSlotId
            ? { slotId: fromSlotId, player: toPlayer }
            : p.slotId === toSlotId
              ? { slotId: toSlotId, player: fromPlayer }
              : p,
        );
      }
      // Mover a una casilla vacía
      return [...prev.filter(p => p.slotId !== fromSlotId), { slotId: toSlotId, player: fromPlayer }];
    });
    setRelocatingSlotId(null);

    // Si el cambio cruza titular <-> suplente, sincronizar la clasificación con el backend
    if (teamId) {
      const fromSlot = currentFormation.slots.find(s => s.id === fromSlotId);
      const toSlot = currentFormation.slots.find(s => s.id === toSlotId);
      const fromIsStarter = fromSlot?.type === 'starter';
      const toIsStarter = toSlot?.type === 'starter';
      if (fromIsStarter !== toIsStarter) {
        try {
          if (toPlayer) await draftService.removePlayerFromTeam(teamId, toPlayer.id);
          if (fromPlayer) await draftService.removePlayerFromTeam(teamId, fromPlayer.id);
          if (fromPlayer) await draftService.addPlayerToTeam(teamId, fromPlayer.id, toIsStarter);
          if (toPlayer) await draftService.addPlayerToTeam(teamId, toPlayer.id, fromIsStarter);
        } catch (err) {
          console.error('Error sincronizando cambio de posición:', err);
        }
      }
    }
  };

  const handleSlotClick = (position: FIFA_POSITION, slotId: string) => {
    const occupant = getPlayerForSlot(slotId);

    // Si la casilla ya tiene un jugador -> se SELECCIONA para moverlo/intercambiarlo
    // (no se abre el overlay de elegir jugador).
    if (occupant) {
      if (relocatingSlotId) {
        if (relocatingSlotId === slotId) {
          // Volver a pulsar la misma casilla cancela la selección
          setRelocatingSlotId(null);
        } else {
          // Intercambiar con el jugador de la casilla seleccionada
          doRelocatePlayer(relocatingSlotId, slotId);
        }
      } else {
        setRelocatingSlotId(slotId);
      }
      return;
    }

    // Casilla vacía: si hay un jugador seleccionado, moverlo aquí
    if (relocatingSlotId) {
      doRelocatePlayer(relocatingSlotId, slotId);
      return;
    }

    // Casilla vacía y sin jugador en movimiento -> abrir overlay de selección
    setSelectedPosition(position);
    setSelectedSlotId(slotId);
    setPackPlayers([]); // Limpiar pack anterior
    setShowPlayerOverlay(true);
  };

  const handleFormationChange = (formationName: string) => {
    if (formationName === activeFormation) return;
    const newFormation = FORMATIONS[formationName];
    if (!newFormation) return;

    // Re-colocar automáticamente a los jugadores en las nuevas casillas
    const players = assignedPlayers.map(ap => ap.player);
    const newAssign = autoAssignPlayers(players, newFormation.slots);

    setActiveFormation(formationName);
    setAssignedPlayers(newAssign);
    setRelocatingSlotId(null);
  };

  const getPlayerForSlot = (slotId: string): Player | undefined => {
    return assignedPlayers.find(p => p.slotId === slotId)?.player;
  };

  const startersCount = assignedPlayers.filter(ap => { const slot = currentFormation.slots.find(s => s.id === ap.slotId); return slot?.type === 'starter'; }).length;

  const substitutesCount = assignedPlayers.filter(ap => { const slot = currentFormation.slots.find(s => s.id === ap.slotId); return slot?.type === 'substitute'; }).length;

  const getRandomPlayers = (players: Player[], count: number): Player[] => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const filteredPlayers = (() => {
    if (selectedPosition === 'ANY') {
      return getRandomPlayers(packPlayers, 5);
    }
    
    // Obtener jugadores ya asignados
    const assignedPlayerIds = new Set(assignedPlayers.map(ap => ap.player.id));
    
    // Filtrar jugadores que pueden jugar EXACTAMENTE en la posición seleccionada
    // y que no estén ya asignados
    const exactMatchPlayers = packPlayers.filter(p => {
      if (assignedPlayerIds.has(p.id)) return false;
      return p.position.toUpperCase().trim() === selectedPosition;
    });
    
    // Si hay 5 o más jugadores con la posición exacta, tomar 5 aleatorios
    if (exactMatchPlayers.length >= 5) {
      return getRandomPlayers(exactMatchPlayers, 5);
    }
    
    // Si hay menos de 5 jugadores con la posición exacta, tomar todos
    // y completar con jugadores compatibles (pero no asignados)
    const remainingNeeded = 5 - exactMatchPlayers.length;
    const compatiblePlayers = packPlayers.filter(p => {
      if (assignedPlayerIds.has(p.id)) return false;
      if (exactMatchPlayers.includes(p)) return false;
      return arePositionsCompatible(selectedPosition, p.position);
    });
    const randomOthers = getRandomPlayers(compatiblePlayers, remainingNeeded);
    
    return [...exactMatchPlayers, ...randomOthers];
  })();

  // ---- Estadísticas del equipo (basadas en los titulares asignados) ----
  // El equipo está completo cuando se llenaron los 18 slots (11 titulares + 7 suplentes)
  const isTeamComplete = assignedPlayers.length === currentFormation.slots.length;
  const missingCount = currentFormation.slots.length - assignedPlayers.length;

  const starterSlots = currentFormation.slots.filter(s => s.type === 'starter');
  const positionedStarters: Array<{ player: Player; zone: TeamZone }> = [];
  for (const s of starterSlots) {
    const p = getPlayerForSlot(s.id);
    if (p) positionedStarters.push({ player: p, zone: ZONE_BY_POSITION[s.position] });
  }

  const avgRating = (players: Array<{ player: Player }>): number =>
    players.length
      ? Math.round(players.reduce((sum, x) => sum + calcPlayerRating(x.player), 0) / players.length)
      : 0;

  const teamOverall = avgRating(positionedStarters);
  const teamDefense = avgRating(positionedStarters.filter(x => x.zone === 'DEF')); // incluye al arquero
  const teamMidfield = avgRating(positionedStarters.filter(x => x.zone === 'MID'));
  const teamAttack = avgRating(positionedStarters.filter(x => x.zone === 'ATT'));

    const teamStats: Array<{ label: string; value: number }> = [
    { label: 'OVR', value: teamOverall },
    { label: 'DEF', value: teamDefense },
    { label: 'MID', value: teamMidfield },
    { label: 'ATT', value: teamAttack },
  ];

  // Renderiza una casilla del campo: mini carta si está ocupada, botón + si está libre.
  const renderPitchSlot = (id: string, position: FIFA_POSITION) => {
    const player = getPlayerForSlot(id);
    const isRelocating = relocatingSlotId === id;

    if (player) {
      return (
        <PlayerMiniCard
          key={id}
          player={player}
          rating={calcPlayerRating(player)}
          isRelocating={isRelocating}
          onClick={() => handleSlotClick(position, id)}
          className="w-16"
        />
      );
    }

    return (
      <button
        key={id}
        onClick={() => handleSlotClick(position, id)}
        className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
      >
        <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
      </button>
    );
  };

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col relative">
      {/* Main Content Area */}
      <main className="flex-1 md:mt-16 px-gutter py-margin max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-margin">
        {/* Left Column: Pitch / Team Builder */}
        <section className="flex-1 flex flex-col gap-sm">
          {/* Header for Pitch */}
          <div className="flex justify-between items-end bg-surface-container-high rounded-t-xl p-md border-b border-white/10">
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-background">{activeFormation}</h1>
              <p className="text-label-md font-label-md text-on-surface-variant">Alineación Táctica</p>
            </div>
            <div className="text-right">
              <div className="text-stat-value font-stat-value text-primary">{startersCount}/11</div>
              <div className="text-label-md font-label-md text-on-surface-variant uppercase font-semibold">TITULARES</div>
            </div>
          </div>

          {/* The Pitch */}
          <div className="pitch-bg rounded-b-xl aspect-[2/3] md:aspect-[4/5] w-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)] relative flex flex-col justify-around py-8 px-4">
            <div className="pitch-lines"></div>
            <div className="pitch-center-circle"></div>
            <div className="pitch-center-line"></div>
            <div className="pitch-penalty-area-top"></div>
            <div className="pitch-penalty-area-bottom"></div>

            {/* Attackers Row */}
            <div className="flex justify-around items-center w-full px-lg z-10 relative">
              {currentFormation.slots.filter(s => ['ED', 'EI', 'SD', 'DC', 'ST'].includes(s.position) && s.type === 'starter').map(({ id, position }) => renderPitchSlot(id, position))}
            </div>

            {/* Midfielders Row */}
            <div className="flex justify-around items-center w-full px-md z-10 relative mt-4">
              {currentFormation.slots.filter(s => ['MI', 'MC', 'MD', 'MCD', 'MCO'].includes(s.position) && s.type === 'starter').map(({ id, position }) => renderPitchSlot(id, position))}
            </div>

            {/* Defenders Row */}
            <div className="flex justify-around items-center w-full px-sm z-10 relative mt-4">
              {currentFormation.slots.filter(s => ['LI', 'DFC', 'LD'].includes(s.position) && s.type === 'starter').map(({ id, position }) => renderPitchSlot(id, position))}
            </div>

            {/* Goalkeeper Row */}
            <div className="flex justify-center items-center w-full z-10 relative mt-4">
              {currentFormation.slots.filter(s => s.position === 'POR' && s.type === 'starter').map(({ id, position }) => renderPitchSlot(id, position))}
            </div>
          </div>

          {relocatingSlotId && (
            <div className="flex items-center justify-between gap-sm bg-tertiary/15 border border-tertiary/40 rounded-lg px-md py-sm mt-2">
              <span className="text-label-md font-label-md text-tertiary">
                Jugador seleccionado para mover. Toca otra posición (ocupada = intercambiar, vacía = mover).
              </span>
              <button
                onClick={() => setRelocatingSlotId(null)}
                className="font-bold uppercase text-xs text-tertiary hover:opacity-80 whitespace-nowrap"
              >
                Cancelar
              </button>
            </div>
          )}
        </section>

        {/* Right Column: Substitutes & Action */}
        <section className="w-full md:w-80 flex flex-col gap-margin">
          {/* Formation Selection */}
          <div className="bg-surface-container-high rounded-xl p-md border border-white/5 shadow-lg">
            <div className="flex justify-between items-center mb-sm">
              <h2 className="text-label-md font-label-md text-on-background uppercase tracking-wider">SELECCIONA TU ALINEACIÓN</h2>
            </div>
            <div className="grid grid-cols-2 gap-sm max-h-48 overflow-y-auto">
              {Object.keys(FORMATIONS).map((formationName) => (
                <div
                  key={formationName}
                  onClick={() => handleFormationChange(formationName)}
                  className={`rounded-lg p-sm cursor-pointer transition-colors flex flex-col items-center justify-center h-16 ${
                    activeFormation === formationName
                      ? 'bg-primary-container/30 border border-primary/50 text-primary'
                      : 'bg-surface border border-white/5 text-on-surface-variant opacity-70 hover:bg-surface-variant hover:opacity-100'
                  }`}
                >
                  <span className="text-headline-sm font-headline-sm font-bold text-xs">{formationName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Substitutes */}
          <div className="bg-surface-container-high rounded-xl p-md border border-white/5 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/10 pb-sm mb-sm">
              <h2 className="text-headline-sm font-headline-sm text-on-background">SUPLENTES</h2>
              <div className="text-stat-value font-stat-value text-on-surface-variant">{substitutesCount}/7</div>
            </div>
            <div className="flex flex-nowrap gap-sm justify-start overflow-x-auto no-scrollbar pb-1 md:flex-wrap md:overflow-visible">
                            {currentFormation.slots.filter(s => s.type === 'substitute').map(({ id, position }) => {
                const player = getPlayerForSlot(id);
                const isRelocating = relocatingSlotId === id;
                return player ? (
                  <PlayerMiniCard
                    key={id}
                    player={player}
                    rating={calcPlayerRating(player)}
                    isRelocating={isRelocating}
                    onClick={() => handleSlotClick(position, id)}
                    className="w-11 shrink-0"
                  />
                ) : (
                  <button
                    key={id}
                    onClick={() => handleSlotClick(position, id)}
                    className="shrink-0 w-14 h-14 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors shadow-inner"
                  >
                    <span className="material-symbols-outlined text-headline-sm">add</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button: JUGAR */}
          {!isTeamComplete && (
            <p className="text-label-md font-label-md text-on-surface-variant text-center px-sm">
              Te faltan <strong className="text-tertiary">{missingCount} jugador{missingCount === 1 ? '' : 'es'}</strong> para poder armar el equipo (selecciona los {currentFormation.slots.length} jugadores).
            </p>
          )}
          <button
            onClick={() => setShowMatchPrepOverlay(true)}
            disabled={!isTeamComplete}
            className={`hidden md:flex w-full py-md px-lg rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm items-center justify-center border border-tertiary shadow-[0_0_15px_rgba(165,208,185,0.3)] hover:shadow-[0_0_25px_rgba(165,208,185,0.6)] transition-all uppercase tracking-wider font-bold ${
              isTeamComplete
                ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            JUGAR
          </button>
        </section>

        {/* Espacio para la barra de acción fija mobile */}
        <div className="h-28 md:hidden" aria-hidden="true" />
      </main>

      {/* Barra de acción fija mobile: dificultad segmentada + Continuar */}
      <div className="mobile-sticky-bar md:hidden bg-surface-container-lowest/95 backdrop-blur-xl border-t border-white/10 px-gutter py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between bg-surface-container-high p-1 rounded-lg">
          {(['Principiante', 'Profesional', 'Leyenda'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-1.5 text-center rounded text-label-md font-label-md font-bold transition-colors ${
                difficulty === d ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowMatchPrepOverlay(true)}
          disabled={!isTeamComplete}
          className={`w-full h-12 rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 uppercase tracking-wider font-bold transition-all ${
            isTeamComplete
              ? 'bg-primary-container text-on-primary active:scale-[0.98]'
              : 'bg-surface-container-high text-on-surface-variant opacity-60 cursor-not-allowed'
          }`}
        >
          Continuar
          <span className="text-label-md font-label-md bg-on-primary text-primary px-2 py-0.5 rounded-full font-bold">
            {startersCount}/{currentFormation.slots.filter((s) => s.type === 'starter').length}
          </span>
        </button>
      </div>

      {/* OVERLAY 1: Player Selection Overlay (pantalla completa en mobile; 5 cartas visibles a la vez) */}
      {showPlayerOverlay && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4">
          <div className="glass-panel w-full h-dvh md:h-auto md:max-h-[90vh] max-w-5xl rounded-t-2xl md:rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden pt-safe md:pt-0 pb-safe md:pb-0">
            <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-surface/50 shrink-0">
              <div className="min-w-0">
                <h2 className="text-headline-sm font-headline-sm text-primary uppercase tracking-wider">Select Player</h2>
                <p className="text-label-md font-label-md text-on-surface-variant mt-1">Position: {selectedPosition}</p>
              </div>
              <button onClick={() => setShowPlayerOverlay(false)} className="text-on-surface-variant hover:text-white transition-colors shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-6">
              {isLoadingPack ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
                </div>
              ) : filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 md:flex md:gap-4 md:w-max md:px-2 md:pb-4 md:overflow-x-auto">
                  {filteredPlayers.map((player) => {
                    const rating = player.rating ?? Math.round(
                      (player.stats.pace + player.stats.shooting + player.stats.passing +
                       player.stats.dribbling + player.stats.defending + player.stats.physical) / 6
                    );
                    const isGold = rating >= 85;
                    return (
                      <div
                        key={player.id}
                        onClick={() => handleSelectPlayer(player)}
                        className={`${isGold ? 'card-gold' : 'card-silver'} w-full md:w-48 h-[180px] md:h-72 rounded-lg p-1 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group ${isGold ? 'opacity-100' : 'opacity-80'} hover:opacity-100`}
                      >
                        <div className="bg-surface-container-lowest h-full w-full rounded-md flex flex-col relative overflow-hidden">
                          <div className="flex justify-between items-start p-1.5 md:p-2 z-10">
                            <div className="flex flex-col items-center">
                              <span className={`text-headline-md font-headline-md drop-shadow-md leading-none text-[16px] md:text-[24px] ${isGold ? 'text-tertiary' : 'text-secondary-fixed'}`}>{rating}</span>
                              <span className="text-label-md font-label-md text-on-surface-variant text-[8px] md:text-[10px] mt-0.5">{player.position}</span>
                            </div>
                            <div className="w-5 h-4 md:w-6 md:h-4 rounded-sm overflow-hidden border border-white/20">
                              <span className={`material-symbols-outlined text-[12px] md:text-[14px] ${isGold ? 'text-tertiary' : 'text-secondary-fixed'}`}>flag</span>
                            </div>
                          </div>
                          <div className="flex-1 flex justify-center items-center z-10 min-h-0">
                            <span className={`material-symbols-outlined text-[34px] md:text-[64px] ${isGold ? 'text-tertiary' : 'text-secondary-fixed'} opacity-80`}>person</span>
                          </div>
                          <div className={`bg-surface-container/90 backdrop-blur-sm border-t p-1.5 md:p-2 z-10 ${isGold ? 'border-tertiary/30' : 'border-secondary-fixed/20'}`}>
                            <h3 className="text-body-md font-body-md font-bold text-center uppercase tracking-wide truncate text-[10px] md:text-sm mb-1">{player.name}</h3>
                            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 md:gap-x-2 md:gap-y-1">
                              <div className="flex justify-between items-center"><span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase">PAC</span><span className="text-label-md font-label-md font-bold text-white text-[9px] md:text-[12px]">{player.stats.pace}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase">DRI</span><span className="text-label-md font-label-md font-bold text-white text-[9px] md:text-[12px]">{player.stats.dribbling}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase">SHO</span><span className="text-label-md font-label-md font-bold text-white text-[9px] md:text-[12px]">{player.stats.shooting}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase">DEF</span><span className="text-label-md font-label-md font-bold text-white text-[9px] md:text-[12px]">{player.stats.defending}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase">PAS</span><span className="text-label-md font-label-md font-bold text-white text-[9px] md:text-[12px]">{player.stats.passing}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase">PHY</span><span className="text-label-md font-label-md font-bold text-white text-[9px] md:text-[12px]">{player.stats.physical}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">person_search</span>
                  <p className="text-label-md text-on-surface-variant">No hay jugadores disponibles para la posición {selectedPosition}. {message || 'Abre un sobre para ver jugadores.'}</p>
                </div>
              )}
            </div>
            <div className="p-3 md:p-4 bg-surface-container-highest border-t border-surface-variant text-center shrink-0">
              <p className="text-label-md text-on-surface-variant text-[12px] md:text-base">
                {message || 'Selecciona un jugador para asignar al slot activo.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: Match Preparation Overlay */}
      {showMatchPrepOverlay && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4">
          <div className="glass-panel w-full max-w-3xl rounded-t-2xl md:rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden max-h-[85dvh] md:max-h-[90vh] pb-safe md:pb-0">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/50">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-primary uppercase tracking-wider">Match Preparation</h2>
                <p className="text-label-md font-label-md text-on-surface-variant mt-1">Team Rating: {teamOverall} OVR</p>
              </div>
              <button onClick={() => setShowMatchPrepOverlay(false)} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Team Stats Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="text-body-md font-body-md text-white font-semibold">Team Stats</h3>
                <p className="text-[12px] text-on-surface-variant">OVR general, defensa (incluye arquero), mediocampo y ataque de tus titulares.</p>
                {/* Stat Bars */}
                <div className="space-y-3">
                  {teamStats.map((s) => {
                    const clamped = Math.min(100, Math.max(0, s.value));
                    const barColor =
                      s.label === 'OVR' ? 'bg-tertiary'
                      : s.label === 'ATT' ? 'bg-tertiary-fixed-dim'
                      : s.label === 'MID' ? 'bg-primary'
                      : 'bg-primary-fixed-dim';
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between text-label-md font-label-md mb-1">
                          <span className="text-on-surface-variant">{s.label}</span>
                          <span className="text-white">{s.value}</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} stat-bar-fill`} style={{ width: `${clamped}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="h-px w-full bg-surface-variant mb-6"></div>
              {/* Difficulty Selector */}
              <div className="space-y-3">
                <h3 className="text-body-md font-body-md text-white font-semibold mb-2">Difficulty</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['Principiante', 'Profesional', 'Leyenda'] as Difficulty[]).map((d) => {
                    const isSelected = difficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 px-1 text-center rounded transition-colors text-label-md ${
                          isSelected
                            ? 'bg-primary-container border border-primary text-primary font-bold shadow-[0_0_10px_rgba(165,208,185,0.2)]'
                            : 'bg-surface-container border border-surface-variant text-on-surface-variant hover:text-white hover:border-primary-fixed-dim'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[12px] text-on-surface-variant text-center mt-2">Rewards multiplier: {DIFFICULTY_MULTIPLIER[difficulty]}</p>
              </div>
            </div>
            <div className="p-6 bg-surface-container-lowest z-10 border-t border-surface-variant">
              <button
                onClick={() => {
                  setShowMatchPrepOverlay(false);
                  onNavigate?.('bracket');
                }}
                disabled={!isTeamComplete}
                className={`w-full py-4 rounded-lg bg-gradient-to-b from-primary to-primary-container text-on-primary font-headline-sm uppercase tracking-wider font-bold border border-primary-fixed shadow-[0_0_15px_rgba(165,208,185,0.3)] hover:shadow-[0_0_25px_rgba(165,208,185,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  isTeamComplete ? '' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                CONFIRMAR Y EMPEZAR PARTIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
