const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const stringSimilarity = require('string-similarity');

const csvFilePath = 'C:\\Pedro\\MetroDev\\El_Pizarron_del_DT\\info_kagle\\male_players.csv';
const jsonBaseDir = 'C:\\Pedro\\MetroDev\\El_Pizarron_del_DT\\Jugadores_Base_de_Datos';

let eaPlayers = [];

// Normalize function for text comparison
const normalize = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const mapTraits = (eaTraitsStr) => {
    if (!eaTraitsStr) return [];
    return eaTraitsStr.split(',').map(t => t.trim());
};

const getBestMatch = (jsonPlayer) => {
    const jsonName = normalize(jsonPlayer.name);
    const jsonNat = normalize(jsonPlayer.nationality);

    // Filter eaPlayers by nationality first to prevent wrong matches and improve speed
    let candidates = eaPlayers.filter(p => normalize(p.nationality_name) === jsonNat);
    if (candidates.length === 0) candidates = eaPlayers; // Fallback if nationality naming differs
    
    let bestMatch = null;
    let highestScore = 0;

    for (const p of candidates) {
        const longNameScore = stringSimilarity.compareTwoStrings(jsonName, normalize(p.long_name));
        const shortNameScore = stringSimilarity.compareTwoStrings(jsonName, normalize(p.short_name));
        const score = Math.max(longNameScore, shortNameScore);
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = p;
        }
    }

    // Threshold of 0.75 ensures we only map highly probable identical players
    if (highestScore > 0.75) {
        return bestMatch;
    }
    return null;
};

function processDirectory(dir) {
    let matchedCount = 0;
    let totalCount = 0;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const res = processDirectory(fullPath);
            matchedCount += res.matchedCount;
            totalCount += res.totalCount;
        } else if (fullPath.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (Array.isArray(data)) {
                let updated = false;
                for (let i = 0; i < data.length; i++) {
                    totalCount++;
                    const player = data[i];
                    const eaPlayer = getBestMatch(player);
                    
                    if (eaPlayer) {
                        matchedCount++;
                        
                        // Inject EA stats (fallback to current if invalid)
                        player.aggression = parseInt(eaPlayer.mentality_aggression) || player.aggression;
                        player.vision = parseInt(eaPlayer.mentality_vision) || player.vision;
                        player.composure = parseInt(eaPlayer.mentality_composure) || player.composure;
                        player.penaltyTaking = parseInt(eaPlayer.mentality_penalties) || player.penaltyTaking;
                        player.freeKickAccuracy = parseInt(eaPlayer.skill_fk_accuracy) || player.freeKickAccuracy;
                        
                        // Weak foot / Skill moves (scale 1-5 to approx 1-99)
                        player.weakFoot = Math.min(99, (parseInt(eaPlayer.weak_foot) || 3) * 20); 
                        player.skillMoves = Math.min(99, (parseInt(eaPlayer.skill_moves) || 3) * 20);
                        
                        // GK Stats
                        if (player.position === 'POR' || player.position === 'GK') {
                            player.gkReflexes = parseInt(eaPlayer.goalkeeping_reflexes) || player.gkReflexes;
                            player.gkHandling = parseInt(eaPlayer.goalkeeping_handling) || player.gkHandling;
                            player.gkAerialOut = parseInt(eaPlayer.goalkeeping_positioning) || player.gkAerialOut;
                            player.gkOneOnOnes = parseInt(eaPlayer.goalkeeping_positioning) || player.gkOneOnOnes;
                        }

                        // Parse existing traitsJson to preserve structure
                        let currentTraits = {};
                        try {
                            if (player.traitsJson) currentTraits = JSON.parse(player.traitsJson);
                        } catch(e){}

                        // Overwrite with real EA foot and traits
                        currentTraits.preferredFoot = eaPlayer.preferred_foot ? eaPlayer.preferred_foot.toLowerCase() : currentTraits.preferredFoot;
                        const eaPlayerTraits = mapTraits(eaPlayer.player_traits);
                        if (eaPlayerTraits.length > 0) {
                            currentTraits.eaTraits = eaPlayerTraits;
                        }

                        player.traitsJson = JSON.stringify(currentTraits);
                        updated = true;
                    }
                }
                if (updated) {
                    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
                }
            }
        }
    }
    return { matchedCount, totalCount };
}

console.log('Loading EA CSV Data (this might take a few seconds)...');
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => eaPlayers.push(data))
  .on('end', () => {
    console.log(`Loaded ${eaPlayers.length} EA Players.`);
    console.log('Processing JSON files with Fuzzy Matching...');
    const result = processDirectory(jsonBaseDir);
    console.log(`Done! Matched ${result.matchedCount} out of ${result.totalCount} players.`);
  });
