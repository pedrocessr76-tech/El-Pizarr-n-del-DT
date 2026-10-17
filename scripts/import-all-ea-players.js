const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const crypto = require('crypto');

const csvFilePath = 'C:\\Pedro\\MetroDev\\El_Pizarron_del_DT\\info_kagle\\male_players.csv';
const outputDir = 'C:\\Pedro\\MetroDev\\El_Pizarron_del_DT\\Jugadores_Base_de_Datos\\Ligas_EA_2024';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// sanitize folder/file names for Windows
const sanitize = (name) => {
    if (!name) return 'Unknown';
    return name.replace(/[<>:"/\\|?*]+/g, '').trim();
};

// Map EA positions to your Spanish equivalents
const mapPosition = (posStr) => {
    if (!posStr) return 'MC';
    const firstPos = posStr.split(',')[0].trim().toUpperCase();
    const map = {
        'GK': 'POR', 'CB': 'DFC', 'LB': 'LI', 'RB': 'LD', 'LWB': 'LI', 'RWB': 'LD',
        'CDM': 'MCD', 'CM': 'MC', 'CAM': 'MCO', 'LM': 'MI', 'RM': 'MD',
        'LW': 'EI', 'RW': 'ED', 'CF': 'SD', 'ST': 'DC', 'LF': 'SD', 'RF': 'SD'
    };
    return map[firstPos] || firstPos;
};

const mapTraits = (eaTraitsStr) => {
    if (!eaTraitsStr) return [];
    return eaTraitsStr.split(',').map(t => t.trim());
};

const clubs = {};

console.log('Reading male_players.csv... (only processing fifa_version = 24.0)');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
      // Only keep the most recent players (FIFA 24)
      if (data.fifa_version !== '24.0') return;

      const league = sanitize(data.league_name);
      const club = sanitize(data.club_name);
      if (league === 'Unknown' || club === 'Unknown' || !league) return;

      if (!clubs[league]) clubs[league] = {};
      if (!clubs[league][club]) clubs[league][club] = [];

      const isGK = data.player_positions && data.player_positions.includes('GK');

      const player = {
          id: crypto.randomUUID(),
          name: data.short_name || data.long_name,
          nationality: data.nationality_name,
          position: mapPosition(data.player_positions),
          rating: parseInt(data.overall) || 50,
          pace: parseInt(data.pace) || (isGK ? 40 : 50),
          shooting: parseInt(data.shooting) || (isGK ? 20 : 50),
          passing: parseInt(data.passing) || (isGK ? 40 : 50),
          dribbling: parseInt(data.dribbling) || (isGK ? 30 : 50),
          defending: parseInt(data.defending) || (isGK ? 20 : 50),
          physical: parseInt(data.physic) || (isGK ? 60 : 50),
          
          aggression: parseInt(data.mentality_aggression) || 50,
          discipline: 60, // EA has no exact 1:1 for this
          composure: parseInt(data.mentality_composure) || 50,
          leadership: 50,
          consistency: 70,
          bigGamePlayer: 60,
          injuryProneness: 50, // Usually hidden or just a trait in EA
          durability: parseInt(data.power_stamina) || 50,
          flair: parseInt(data.skill_dribbling) || 50,
          vision: parseInt(data.mentality_vision) || 50,
          penaltyTaking: parseInt(data.mentality_penalties) || 50,
          freeKickAccuracy: parseInt(data.skill_fk_accuracy) || 50,
          aerialAbility: parseInt(data.attacking_heading_accuracy) || 50,
          weakFoot: Math.min(99, (parseInt(data.weak_foot) || 3) * 20),
          skillMoves: Math.min(99, (parseInt(data.skill_moves) || 3) * 20),
          
          gkReflexes: parseInt(data.goalkeeping_reflexes) || 1,
          gkHandling: parseInt(data.goalkeeping_handling) || 1,
          gkAerialOut: parseInt(data.goalkeeping_positioning) || 1,
          gkCommunication: 50,
          gkOneOnOnes: parseInt(data.goalkeeping_positioning) || 1,
          
          traitsJson: JSON.stringify({
              preferredFoot: data.preferred_foot ? data.preferred_foot.toLowerCase() : "right",
              eaTraits: mapTraits(data.player_traits)
          })
      };

      clubs[league][club].push(player);
  })
  .on('end', () => {
      console.log('Finished parsing EA CSV. Generating JSON files...');
      let totalPlayers = 0;
      let totalClubs = 0;
      for (const league of Object.keys(clubs)) {
          const leagueDir = path.join(outputDir, league);
          if (!fs.existsSync(leagueDir)) fs.mkdirSync(leagueDir, { recursive: true });

          for (const club of Object.keys(clubs[league])) {
              const clubPath = path.join(leagueDir, `${club}.json`);
              fs.writeFileSync(clubPath, JSON.stringify(clubs[league][club], null, 2), 'utf8');
              totalPlayers += clubs[league][club].length;
              totalClubs++;
          }
      }
      console.log(`Successfully exported ${totalPlayers} players grouped by ${Object.keys(clubs).length} ligas y ${totalClubs} clubes.`);
      console.log(`Data saved to: ${outputDir}`);
  });
