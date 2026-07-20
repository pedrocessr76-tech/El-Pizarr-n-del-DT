import { Injectable } from '@nestjs/common';
import type { Player } from '../../../../packages/shared/types/models';
import { mockPlayers } from '../../../../packages/shared/types/mockData';

export interface PlayerPack {
  players: Player[];
}

@Injectable()
export class DraftService {
  private selectedPlayers: Player[] = [];

  getPack(): PlayerPack {
    const copy = [...mockPlayers];
    const shuffled = copy.sort(() => Math.random() - 0.5);
    const pack = shuffled.slice(0, 5);
    return { players: pack };
  }

  selectPlayer(playerId: string): { success: boolean; selectedPlayers: Player[]; message: string } {
    const player = mockPlayers.find((p) => p.id === playerId);
    if (!player) {
      return {
        success: false,
        selectedPlayers: this.selectedPlayers,
        message: 'Jugador no encontrado en el sobre.',
      };
    }

    if (this.selectedPlayers.length >= 11) {
      return {
        success: false,
        selectedPlayers: this.selectedPlayers,
        message: 'El equipo ya está completo.',
      };
    }

    this.selectedPlayers.push(player);

    return {
      success: true,
      selectedPlayers: this.selectedPlayers,
      message: 'Jugador agregado al equipo.',
    };
  }

  getSelectedPlayers(): Player[] {
    return this.selectedPlayers;
  }
}
