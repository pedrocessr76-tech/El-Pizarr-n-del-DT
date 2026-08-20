import React, { useState, useEffect } from 'react';
import type { Player } from '../../../../packages/shared/types/models';
import { draftService } from '../services/draftService';
import { useAuthStore } from '../store/useAuthStore';
import { useDraftStore } from '../store/useDraftStore';
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

export const TeamBuilderPage: React.FC<TeamBuilderPageProps> = ({ onBack, onNavigate }) => {
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
  const { user } = useAuthStore();
  const { teamId, setTeamId } = useDraftStore();

  const currentFormation = FORMATIONS[activeFormation] || FORMATIONS['4-3-3 (Plana)'];

  useEffect(() => {
    if (showPlayerOverlay && packPlayers.length === 0) {
      loadPack();
    }
  }, [showPlayerOverlay]);

  useEffect(() => {
    createTeamIfNeeded();
  }, [user]);

  const createTeamIfNeeded = async () => {
    try {
      if (!teamId) {
        if (user) {
          const response = await draftService.createTeam(user.id);
          setTeamId(response.teamId);
        } else {
          const { getOrCreateGuestSessionId, setGuestTeamId } = await import('../utils/session');
          const sessionId = getOrCreateGuestSessionId();
          const response = await draftService.createTeam(undefined, sessionId);
          setTeamId(response.teamId);
          setGuestTeamId(response.teamId);
        }
      }
    } catch (err) {
      console.error('Error creando equipo:', err);
    }
  };

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

  const handleSlotClick = (position: FIFA_POSITION, slotId: string) => {
    setSelectedPosition(position);
    setSelectedSlotId(slotId);
    setPackPlayers([]); // Limpiar pack anterior
    setShowPlayerOverlay(true);
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

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col relative">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-40 flex justify-between items-center px-gutter h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <button
          onClick={onBack}
          className="text-primary hover:opacity-80 transition-opacity flex items-center gap-xs"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          <span className="font-label-md text-label-md hidden md:inline">Atrás</span>
        </button>
        <div className="text-headline-md font-headline-md font-extrabold text-primary tracking-tighter">
          FOOTBALL ELITE
        </div>
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined hover:opacity-80 transition-opacity cursor-pointer">account_circle</span>
          <span className="material-symbols-outlined hover:opacity-80 transition-opacity cursor-pointer">settings</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 mt-16 pb-32 md:pb-0 px-gutter py-margin max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-margin">
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
          <div className="pitch-bg rounded-b-xl aspect-[3/4] md:aspect-[4/5] w-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)] relative flex flex-col justify-around py-8 px-4">
            <div className="pitch-lines"></div>
            <div className="pitch-center-circle"></div>
            <div className="pitch-center-line"></div>
            <div className="pitch-penalty-area-top"></div>
            <div className="pitch-penalty-area-bottom"></div>

            {/* Attackers Row */}
            <div className="flex justify-around items-center w-full px-lg z-10 relative">
              <button
                onClick={() => handleSlotClick('EI', 'slot-lw')}
                className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
              </button>

              {(() => {
                const slot = currentFormation.slots.find(s => s.id === 'slot-st');
                const player = slot ? getPlayerForSlot('slot-st') : undefined;
                                return player ? (
                  <button
                    onClick={() => handleSlotClick('DC', 'slot-st')}
                    className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-tertiary shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                  >
                    <div className="w-full h-full rounded-full bg-surface-container-high border border-tertiary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-tertiary uppercase">{player.position}</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSlotClick('DC', 'slot-st')}
                    className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
                  >
                    <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
                  </button>
                );
              })()}

              <button
                onClick={() => handleSlotClick('ED', 'slot-rw')}
                className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
              </button>
            </div>

            {/* Midfielders Row */}
            <div className="flex justify-around items-center w-full px-md z-10 relative mt-4">
              {currentFormation.slots.filter(s => ['MI', 'MC', 'MD', 'MCD', 'MCO'].includes(s.position) && s.type === 'starter').map(({ id, position }) => {
                const player = getPlayerForSlot(id);
                return (
                  <button
                    key={id}
                    onClick={() => handleSlotClick(position, id)}
                    className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
                  >
                    {player ? (
                      <div className="w-full h-full rounded-full bg-surface-container-high border border-tertiary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-tertiary uppercase">{player.position}</span>
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Defenders Row */}
            <div className="flex justify-around items-center w-full px-sm z-10 relative mt-4">
              {currentFormation.slots.filter(s => ['LI', 'DFC', 'LD'].includes(s.position) && s.type === 'starter').map(({ id, position }) => {
                const player = getPlayerForSlot(id);
                return (
                  <button
                    key={id}
                    onClick={() => handleSlotClick(position, id)}
                    className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
                  >
                    {player ? (
                      <div className="w-full h-full rounded-full bg-surface-container-high border border-tertiary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-tertiary uppercase">{player.position}</span>
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Goalkeeper Row */}
            <div className="flex justify-center items-center w-full z-10 relative mt-4">
              {(() => {
                const player = getPlayerForSlot('slot-gk');
                return (
                  <button
                    onClick={() => handleSlotClick('POR', 'slot-gk')}
                    className="w-16 h-16 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary hover:bg-surface-variant transition-colors shadow-lg"
                  >
                    {player ? (
                      <div className="w-full h-full rounded-full bg-surface-container-high border border-tertiary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-tertiary uppercase">POR</span>
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-headline-md font-headline-md">add</span>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
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
                  onClick={() => setActiveFormation(formationName)}
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
            <div className="flex flex-wrap gap-sm justify-start">
              {currentFormation.slots.filter(s => s.type === 'substitute').map(({ id, position }) => {
                const player = getPlayerForSlot(id);
                return (
                  <button
                    key={id}
                    onClick={() => handleSlotClick(position, id)}
                    className="w-14 h-14 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors shadow-inner"
                  >
                    {player ? (
                      <span className="text-[10px] font-bold text-tertiary uppercase">{player.position}</span>
                    ) : (
                      <span className="material-symbols-outlined text-headline-sm">add</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button: JUGAR */}
          <button
            onClick={() => setShowMatchPrepOverlay(true)}
            className="w-full py-md px-lg rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center border border-tertiary shadow-[0_0_15px_rgba(165,208,185,0.3)] hover:shadow-[0_0_25px_rgba(165,208,185,0.6)] transition-all uppercase tracking-wider font-bold"
          >
            JUGAR
          </button>
        </section>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full z-40 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container-lowest/90 dark:bg-surface-container-lowest/90 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <a className="flex flex-col items-center justify-center text-primary bg-primary-container/30 rounded-xl px-4 py-1 scale-90 transition-transform duration-150" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>strategy</span>
          <span className="text-label-md font-label-md mt-1">Plantilla</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>storefront</span>
          <span className="text-label-md font-label-md mt-1">Mercado</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>sports_soccer</span>
          <span className="text-label-md font-label-md mt-1">Jugar</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>shield</span>
          <span className="text-label-md font-label-md mt-1">Club</span>
        </a>
      </nav>

      {/* OVERLAY 1: Player Selection Overlay */}
      {showPlayerOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-5xl rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/50">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-primary uppercase tracking-wider">Select Player</h2>
                <p className="text-label-md font-label-md text-on-surface-variant mt-1">Position: {selectedPosition}</p>
              </div>
              <button onClick={() => setShowPlayerOverlay(false)} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-x-auto no-scrollbar">
              {isLoadingPack ? (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
                </div>
              ) : filteredPlayers.length > 0 ? (
                <div className="flex gap-4 w-max px-2 pb-4">
                  {filteredPlayers.map((player) => {
                    const rating = Math.round(
                      (player.stats.pace + player.stats.shooting + player.stats.passing +
                       player.stats.dribbling + player.stats.defending + player.stats.physical) / 6
                    );
                    const isGold = rating >= 85;
                    return (
                      <div
                        key={player.id}
                        onClick={() => handleSelectPlayer(player)}
                        className={`${isGold ? 'card-gold' : 'card-silver'} w-48 h-72 rounded-lg p-1 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group opacity-${isGold ? '100' : '80'} hover:opacity-100`}
                      >
                        <div className="bg-surface-container-lowest h-full w-full rounded-md flex flex-col relative overflow-hidden">
                          <div className="flex justify-between items-start p-2 z-10">
                            <div className="flex flex-col items-center">
                              <span className={`text-headline-md font-headline-md drop-shadow-md ${isGold ? 'text-tertiary' : 'text-secondary-fixed'}`}>{rating}</span>
                              <span className="text-label-md font-label-md text-on-surface-variant">{player.position}</span>
                            </div>
                            <div className="w-6 h-4 rounded-sm overflow-hidden border border-white/20">
                              <span className={`material-symbols-outlined text-[14px] ${isGold ? 'text-tertiary' : 'text-secondary-fixed'}`}>flag</span>
                            </div>
                          </div>
                          <div className="flex-1 flex justify-center items-center z-10">
                            <span className={`material-symbols-outlined text-[64px] ${isGold ? 'text-tertiary' : 'text-secondary-fixed'} opacity-80`}>person</span>
                          </div>
                          <div className={`bg-surface-container/90 backdrop-blur-sm border-t p-2 z-10 ${isGold ? 'border-tertiary/30' : 'border-secondary-fixed/20'}`}>
                            <h3 className="text-body-md font-body-md font-bold text-center uppercase tracking-wide truncate mb-1">{player.name}</h3>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <div className="flex justify-between items-center"><span className="text-[10px] text-on-surface-variant uppercase">PAC</span><span className="text-label-md font-label-md font-bold text-white">{player.stats.pace}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] text-on-surface-variant uppercase">DRI</span><span className="text-label-md font-label-md font-bold text-white">{player.stats.dribbling}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] text-on-surface-variant uppercase">SHO</span><span className="text-label-md font-label-md font-bold text-white">{player.stats.shooting}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] text-on-surface-variant uppercase">DEF</span><span className="text-label-md font-label-md font-bold text-white">{player.stats.defending}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] text-on-surface-variant uppercase">PAS</span><span className="text-label-md font-label-md font-bold text-white">{player.stats.passing}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[10px] text-on-surface-variant uppercase">PHY</span><span className="text-label-md font-label-md font-bold text-white">{player.stats.physical}</span></div>
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
            <div className="p-4 bg-surface-container-highest border-t border-surface-variant text-center">
              <p className="text-label-md text-on-surface-variant">
                {message || 'Selecciona un jugador para asignar al slot activo.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: Match Preparation Overlay */}
      {showMatchPrepOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-3xl rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/50">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-primary uppercase tracking-wider">Match Preparation</h2>
                <p className="text-label-md font-label-md text-on-surface-variant mt-1">Team Rating: 88 OVR</p>
              </div>
              <button onClick={() => setShowMatchPrepOverlay(false)} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Team Stats Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="text-body-md font-body-md text-white font-semibold">Team Stats</h3>
                {/* Stat Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-label-md font-label-md mb-1">
                      <span className="text-on-surface-variant">ATT</span>
                      <span className="text-white">92</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary stat-bar-fill" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-label-md font-label-md mb-1">
                      <span className="text-on-surface-variant">MID</span>
                      <span className="text-white">86</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary stat-bar-fill" style={{ width: '86%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-label-md font-label-md mb-1">
                      <span className="text-on-surface-variant">DEF</span>
                      <span className="text-white">84</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary-fixed-dim stat-bar-fill" style={{ width: '84%' }}></div>
                    </div>
                  </div>
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
                className="w-full py-4 rounded-lg bg-gradient-to-b from-primary to-primary-container text-on-primary font-headline-sm uppercase tracking-wider font-bold border border-primary-fixed shadow-[0_0_15px_rgba(165,208,185,0.3)] hover:shadow-[0_0_25px_rgba(165,208,185,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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