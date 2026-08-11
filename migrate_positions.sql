-- Migración de posiciones de jugadores a formato FIFA estándar
-- Este script convierte las posiciones antiguas al formato que utiliza el programa

-- Actualizar posiciones de porteros
UPDATE players SET position = 'POR' WHERE position IN ('GK', 'POR');

-- Actualizar posiciones de laterales
UPDATE players SET position = 'LD' WHERE position IN ('RB', 'RWB', 'LD');
UPDATE players SET position = 'LI' WHERE position IN ('LB', 'LWB', 'LI');

-- Actualizar posiciones de defensas centrales
UPDATE players SET position = 'DFC' WHERE position IN ('CB', 'DEF', 'DFC');

-- Actualizar posiciones de mediocentros
UPDATE players SET position = 'MCD' WHERE position IN ('CDM', 'MCD');
UPDATE players SET position = 'MC' WHERE position IN ('CM', 'MC');
UPDATE players SET position = 'MCO' WHERE position IN ('CAM', 'MCO');

-- Actualizar posiciones de mediocampistas laterales
UPDATE players SET position = 'MD' WHERE position IN ('RM', 'RW', 'MD');
UPDATE players SET position = 'MI' WHERE position IN ('LM', 'LW', 'MI');

-- Actualizar posiciones de extremos
UPDATE players SET position = 'ED' WHERE position IN ('RW', 'ED');
UPDATE players SET position = 'EI' WHERE position IN ('LW', 'EI');

-- Actualizar posiciones de delanteros
UPDATE players SET position = 'DC' WHERE position IN ('FWD', 'DC', 'DC');
UPDATE players SET position = 'ST' WHERE position IN ('ST', 'ST');
UPDATE players SET position = 'SD' WHERE position IN ('CF', 'SS', 'SD');

-- Mostrar resumen de posiciones después de la migración
SELECT position, COUNT(*) as count 
FROM players 
GROUP BY position 
ORDER BY position;