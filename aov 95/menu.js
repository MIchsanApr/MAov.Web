// Global State for Menus
let appState = {
    screen: 'MENU', // MENU, SELECT, GAME
    gameMode: 'VS_AI', // VS_AI, VS_PVP
    difficulty: 'normal',
    p1Char: null,
    p2Char: null
};

// Character Select DOM Generation
function initCharSelect() {
    const leftCol = document.getElementById('roster-left');
    const rightCol = document.getElementById('roster-right');

    CHARACTERS.forEach((char, index) => {
        const slot = document.createElement('div');
        slot.className = 'char-slot';
        slot.innerText = char.name;
        slot.dataset.id = char.id;
        
        // 5 on left, 5 on right
        if (index < 5) leftCol.appendChild(slot);
        else rightCol.appendChild(slot);
    });
}

// Simple Menu Navigation Logic
document.addEventListener('keydown', (e) => {
    if (appState.screen === 'MENU') handleMenuInput(e);
    else if (appState.screen === 'SELECT') handleSelectInput(e);
});

let menuIndex = 0;
const menuOptions = document.querySelectorAll('.menu-options .option');

function handleMenuInput(e) {
    if (e.key === 'w' || e.key === 'ArrowUp') {
        menuIndex = (menuIndex - 1 + menuOptions.length) % menuOptions.length;
        updateMenuHighlight();
    }
    if (e.key === 's' || e.key === 'ArrowDown') {
        menuIndex = (menuIndex + 1) % menuOptions.length;
        updateMenuHighlight();
    }
    // Di dalam menu.js, ganti logika 'Enter' pada function handleMenuInput(e):

if (e.key === 'Enter') {
    const action = menuOptions[menuIndex].dataset.action;

    if (action === 'vs-ai') {
        // Mode Lawan Komputer
        appState.gameMode = 'VS_AI';
        document.querySelector('.vs-badge').innerText = "VS CPU"; // Update teks visual
        switchScreen('char-select');
    } 
    else if (action === 'vs-pvp') {
        // Mode Lawan Teman (Satu Keyboard)
        appState.gameMode = 'VS_PVP';
        document.querySelector('.vs-badge').innerText = "VS P2"; // Update teks visual
        switchScreen('char-select');
    } 
    else if (action === 'exit') {
        window.close();
        alert("Thanks for playing!"); // Fallback jika window.close diblokir browser
    }
}
}

function updateMenuHighlight() {
    menuOptions.forEach((opt, i) => {
        opt.classList.toggle('active', i === menuIndex);
    });
}

// Logic for char select (Mouse click for prototype simplicity)
// In a real arcade build, this would be grid navigation
document.addEventListener('click', (e) => {
    if (appState.screen !== 'SELECT') return;
    if (e.target.classList.contains('char-slot')) {
        const charId = e.target.dataset.id;
        
        if (!appState.p1Char) {
            appState.p1Char = charId;
            e.target.classList.add('p1-selected');
            document.getElementById('p1-name').innerText = getCharacterData(charId).name;
        } else if (!appState.p2Char) {
            appState.p2Char = charId;
            e.target.classList.add('p2-selected');
            document.getElementById('p2-name').innerText = getCharacterData(charId).name;
            
            // Start Game after delay
            setTimeout(() => {
                startGame(appState.p1Char, appState.p2Char, appState.gameMode);
            }, 1000);
        }
    }
});

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    if (id === 'char-select') {
        appState.screen = 'SELECT';
        appState.p1Char = null;
        appState.p2Char = null;
        // Reset visual slots
        document.querySelectorAll('.char-slot').forEach(s => s.classList.remove('p1-selected', 'p2-selected'));
    } else if (id === 'main-menu') {
        appState.screen = 'MENU';
    }
}

// Initialize
initCharSelect();