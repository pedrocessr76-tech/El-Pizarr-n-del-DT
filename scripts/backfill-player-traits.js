const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Pedro\\MetroDev\\El_Pizarron_del_DT\\Jugadores_Base_de_Datos';

function getTraitValues(player) {
    const isGK = player.position === 'POR' || player.position === 'GK';
    const isDEF = ['DFC', 'LI', 'LD', 'DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CAD', 'CAI'].includes(player.position);
    const isMID = ['MCD', 'MC', 'MCO', 'MI', 'MD', 'MID', 'CDM', 'CM', 'CAM', 'LM', 'RM'].includes(player.position);
    const isFWD = ['DC', 'EI', 'ED', 'SD', 'FWD', 'ST', 'CF', 'LW', 'RW'].includes(player.position);

    let aggression = 50, discipline = 50, composure = 50, leadership = 50, consistency = 50;
    let bigGamePlayer = 50, injuryProneness = 50, durability = 50, flair = 50, vision = 50;
    let penaltyTaking = 50, freeKickAccuracy = 50, aerialAbility = 50, weakFoot = 50, skillMoves = 50;
    let gkReflexes = 0, gkHandling = 0, gkAerialOut = 0, gkCommunication = 0, gkOneOnOnes = 0;

    // Base on rating (leyenda > 85, top > 75, etc.)
    let tierBase = 50;
    if (player.rating >= 85) tierBase = 85;
    else if (player.rating >= 75) tierBase = 75;
    else if (player.rating >= 65) tierBase = 65;
    
    consistency = tierBase;
    composure = tierBase;
    bigGamePlayer = tierBase;
    
    if (isGK) {
        aggression = 40; discipline = 80; flair = 30; vision = 60;
        penaltyTaking = 40; freeKickAccuracy = 30; aerialAbility = 70; weakFoot = 50; skillMoves = 20;
        gkReflexes = tierBase + 10;
        gkHandling = tierBase + 8;
        gkAerialOut = tierBase + 5;
        gkCommunication = tierBase + 5;
        gkOneOnOnes = tierBase + 8;
    } else if (isDEF) {
        aggression = 80; discipline = 60; flair = 40; vision = 60;
        penaltyTaking = 40; freeKickAccuracy = 40; aerialAbility = 80; weakFoot = 55; skillMoves = 40;
    } else if (isMID) {
        aggression = 60; discipline = 70; flair = 80; vision = 85;
        penaltyTaking = 60; freeKickAccuracy = 70; aerialAbility = 60; weakFoot = 70; skillMoves = 75;
    } else if (isFWD) {
        aggression = 50; discipline = 60; flair = 80; vision = 70;
        penaltyTaking = 80; freeKickAccuracy = 60; aerialAbility = 75; weakFoot = 75; skillMoves = 80;
    }

    // Boost by nationality
    const latinos = ['Argentina', 'Brasil', 'Uruguay', 'Chile', 'Colombia', 'Paraguay', 'Ecuador', 'Peru', 'Venezuela', 'Bolivia'];
    const europe1 = ['España', 'Italia', 'Alemania', 'Francia', 'Spain', 'Italy', 'Germany', 'France'];
    const europe2 = ['Inglaterra', 'Portugal', 'Países Bajos', 'England', 'Netherlands', 'Holland'];

    if (latinos.includes(player.nationality)) {
        aggression += 10; flair += 15; bigGamePlayer += 10; discipline -= 5;
    } else if (europe1.includes(player.nationality)) {
        aggression += 5; flair += 10; bigGamePlayer += 5; discipline += 5;
    } else if (europe2.includes(player.nationality)) {
        aggression += 5; flair += 5; bigGamePlayer += 5;
    }

    // Cap at 99 and 1
    const cap = (val) => Math.max(1, Math.min(99, Math.round(val)));

    const playingStyle = [];
    if (isDEF) playingStyle.push('hard_tackler');
    if (isMID) playingStyle.push('playmaker');
    if (isFWD) playingStyle.push('poacher');
    if (isGK) playingStyle.push('shot_stopper');

    const traitsJson = JSON.stringify({
        playingStyle: playingStyle,
        preferredFoot: "right"
    });

    return {
        id: player.id,
        name: player.name,
        nationality: player.nationality,
        position: player.position,
        rating: player.rating,
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physical: player.physical,
        aggression: cap(aggression),
        discipline: cap(discipline),
        composure: cap(composure),
        leadership: cap(leadership),
        consistency: cap(consistency),
        bigGamePlayer: cap(bigGamePlayer),
        injuryProneness: cap(injuryProneness),
        durability: cap(durability),
        flair: cap(flair),
        vision: cap(vision),
        penaltyTaking: cap(penaltyTaking),
        freeKickAccuracy: cap(freeKickAccuracy),
        aerialAbility: cap(aerialAbility),
        weakFoot: cap(weakFoot),
        skillMoves: cap(skillMoves),
        gkReflexes: cap(gkReflexes),
        gkHandling: cap(gkHandling),
        gkAerialOut: cap(gkAerialOut),
        gkCommunication: cap(gkCommunication),
        gkOneOnOnes: cap(gkOneOnOnes),
        traitsJson: traitsJson
    };
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (Array.isArray(data)) {
                const updated = data.map(getTraitValues);
                fs.writeFileSync(fullPath, JSON.stringify(updated, null, 2), 'utf8');
            }
        }
    }
}

processDirectory(baseDir);
console.log('Done processing JSON files.');
