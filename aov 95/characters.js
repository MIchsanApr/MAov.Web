const CHARACTERS = [
    {
        id: 'mortyx',
        name: 'MORTYX',
        color: '#4a3b75', // Dark Purple
        width: 60, height: 110,
        stats: { health: 140, speed: 3, damage: 1.2 },
        ultName: 'Cube of Creation',
        desc: 'Tank / Heavy Hitter'
    },
    {
        id: 'evince',
        name: 'EVINCE',
        color: '#00f3ff', // Cyan
        width: 50, height: 100,
        stats: { health: 100, speed: 5, damage: 1.0 },
        ultName: 'Evolution Override',
        desc: 'Balanced / Adaptable'
    },
    {
        id: 'leviathan',
        name: 'LEVIATHAN',
        color: '#ff3333', // Red
        width: 45, height: 95,
        stats: { health: 85, speed: 7, damage: 0.9 },
        ultName: 'Last EB Standing',
        desc: 'Speed Assassin'
    },
    {
        id: 'vein',
        name: 'VEIN',
        color: '#0aff00', // Green
        width: 50, height: 100,
        stats: { health: 110, speed: 4, damage: 0.8 },
        ultName: 'Dominion Protocol',
        desc: 'Control / Support'
    },
    // Placeholders to fill the 10 slots
    { id: 'eb-05', name: 'GLITCH', color: '#555', width: 50, height: 100, stats: { health: 100, speed: 5, damage: 1 }, ultName: 'Static Shock' },
    { id: 'eb-06', name: 'SHADE', color: '#333', width: 50, height: 100, stats: { health: 90, speed: 6, damage: 1.1 }, ultName: 'Shadow Step' },
    { id: 'eb-07', name: 'STEEL', color: '#888', width: 70, height: 110, stats: { health: 150, speed: 2, damage: 1.3 }, ultName: 'Iron Wall' },
    { id: 'eb-08', name: 'FLARE', color: '#ffaa00', width: 50, height: 100, stats: { health: 100, speed: 5, damage: 1.2 }, ultName: 'Supernova' },
    { id: 'eb-09', name: 'FROST', color: '#aaddff', width: 50, height: 100, stats: { health: 110, speed: 4, damage: 0.9 }, ultName: 'Absolute Zero' },
    { id: 'eb-10', name: 'VOID', color: '#111', width: 55, height: 105, stats: { health: 120, speed: 4, damage: 1.1 }, ultName: 'Black Hole' },
];

function getCharacterData(id) {
    return CHARACTERS.find(c => c.id === id);
}