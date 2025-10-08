// ================================================================================
// ENTRY POINT
// ================================================================================

const findTheTreasure = document.getElementById("find-the-treasure");

// Primary entry point - Click to start game
findTheTreasure.onclick = () => findTheTreasureEntrance();

// Secondary entry point - Space key to start game
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        findTheTreasureEntrance();
    }
});

// ================================================================================
// VARIABLES
// ================================================================================

// ---- DOM ELEMENT REFERENCES ----

// Container elements
const bodyCon = document.body;
const gameCon = document.querySelector(".game-container");
const mainCon = document.getElementById("main-con");
const runningCon = document.getElementById("running-con");
const menuCon = document.getElementById("menu");
const gameOverCon = document.getElementById("game-over");
const nextRoundCon = document.getElementById("next-round");
const retryRoundCon = document.getElementById("retry-round-con");
const leaderboardCon = document.getElementById("leaderboard-con")
const instructionCon = document.getElementById("instruction-con")
const modalCon = document.getElementById("modal-con");
const overlay = document.querySelector(".overlay");

// UI control elements
const lbCloseBtn = document.getElementById("close-leaderboard");
const itCloseBtn = document.getElementById("close-instruction");
const lbEntries = document.getElementById("leaderboard-entries");
const playerNameInput = document.getElementById("name-input");
const currentUserCon = document.getElementById("current-user-con");

// Game statistics display elements
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const roundEl = document.getElementById("round");
const selectionEl = document.getElementById("selection");
const lifeEl = document.getElementById("life");

// Final/summary statistics elements
const finalRoundEl = document.getElementById("final-round");
const finalScoreEl = document.getElementById("final-score");
const currentScoreEl = document.getElementById("current-score");
const currentRoundEl = document.getElementById("current-round");
const currentLifeEl = document.getElementById("current-life");
const retryScoreEl = document.getElementById("retry-score");
const retryRoundEl = document.getElementById("retry-round");
const retryLifeEl = document.getElementById("retry-life");

// Button elements
const allBtn = document.querySelectorAll("button");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const nextRoundBtn = document.getElementById("next-round-btn");
const retryRoundBtn = document.getElementById("retry-round-btn");
const instructionBtn = document.getElementById("instruction-btn");
const leaderboardBtn = document.getElementById("leaderboard-btn");

// Game grid element
const grid = document.getElementById("grid");

// ---- AUDIO ELEMENTS ----

// Background music
const bgm = new Audio("mp3/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.5;

// Menu music
const menuSound = new Audio("mp3/menu.mp3");
menuSound.loop = true;
menuSound.volume = 1;

// Sound effects
const extraLifeSound = new Audio("mp3/1up.mp3");
const coinSound = new Audio("mp3/coin.mp3");
const gameOverSound = new Audio("mp3/game_over.mp3");
const wrongSound = new Audio("mp3/wrong.mp3");
const onHoverSound = new Audio("mp3/onhover.wav");

// ---- GAME STATE VARIABLES ----

// Timer variables
let gameTime = 10;
let timerInterval = null;

// Core game statistics
let score = 0;
let round = 1;
let maxSelection = 2;
let selection = 0;
let life = 2;

// Position arrays
let treasurePosition = [];
let guessedPosition = [];
let extraLifePosition = [];
let extraXpPosition = [];
let treasureCount = 2;

// Game status flags
let isGuessed = false;
let boxCount = 9;
let world1 = 5;
let world2 = 10;
let gameInProgress = false;

// Combo system
let combo = 0;
let comboMultiplier = 1;

// Bonus challenge event
let isBonusRound = false;
let bonusDuration = 10;

// ================================================================================
// FUNCTIONS
// ================================================================================

// ---- ENTRY POINT FUNCTION ----

// Game entrance with circle animation and initialization
function findTheTreasureEntrance() {
    // only run entrance once
    if (findTheTreasure.classList.contains('d-none')) return;
    findTheTreasure.classList.add("d-none");
    const defaultSize = 1100;
    overlay.style.setProperty('--circle-size', `${defaultSize}px`);
    for (let size = 0; size <= defaultSize; size += 10) {
        setTimeout(() => {
            overlay.style.setProperty('--circle-size', `${size}px`);
        }, (size) * 0.5);
    }
    player(); // Generate random player name
    main();    // Initialize main game
}

// ---- CORE GAME FUNCTIONS ----

// Main initialization - Sets up event listeners and starts menu music
function main() {
    // Idempotent event bindings
    startBtn.onclick = startGame;
    restartBtn.onclick = function () {
        circleEffect();
        setTimeout(menu, 700)
    }
    nextRoundBtn.onclick = () => nextRound("new");
    retryRoundBtn.onclick = () => retry("new");
    leaderboardBtn.onclick = () => leaderboard("view");
    instructionBtn.onclick = () => instructions("view");
    lbCloseBtn.onclick = () => leaderboard("close");
    itCloseBtn.onclick = () => instructions("close");

    // Start menu music
    stopBGM();
    playMenuSound();
    onHoverSFX();
}

// Menu function - Returns to main menu and resets everything
function menu() {
    // Stop all sounds
    stopBGM();
    stopMenuSound();

    // Stop timer and mark not in progress
    stopTimer();
    gameInProgress = false;

    // Reset game data + background
    resetSettings("new");
    resetBackground();

    // Reset UI
    runningCon.classList.add("d-none");
    gameOverCon.classList.add("d-none");
    nextRoundCon.classList.add("d-none");
    retryRoundCon.classList.add("d-none");
    modalCon.classList.add("d-none");
    menuCon.classList.remove("d-none");

    // Reset stats display
    scoreEl.innerHTML = score;
    roundEl.innerHTML = round;
    lifeEl.innerHTML = life;
    selectionEl.innerHTML = selection + "/" + maxSelection;
    timeEl.innerHTML = gameTime + "s";

    // Play menu music again
    playMenuSound();
}

// Start game function - Begins a new game session
function startGame() {
    // stop menu music
    stopMenuSound();

    // play game bgm
    playBGM();

    menuCon.classList.add("d-none");
    runningCon.classList.remove("d-none");
    gameOverCon.classList.add("d-none");
    nextRoundCon.classList.add("d-none");
    modalCon.classList.add("d-none");

    resetSettings("new");
    resetBackground();
    difficulty(); // set initial difficulty (may alter boxCount)
    createCard();
    roundEl.innerHTML = round;
    scoreEl.innerHTML = score;
    lifeEl.innerHTML = life;
    selectionEl.innerHTML = selection + '/' + maxSelection;
    gameInProgress = true;
    isGuessed = false;
    timerStart();
}

// ---- ROUND MANAGEMENT FUNCTIONS ----

// Next round function - Handles progression to next round
function nextRound(todo) {
    if (todo === "display") {
        // Pause timer and freeze interactions
        stopTimer();
        gameInProgress = false;
        isBonusRound = false;

        nextRoundCon.classList.remove("d-none");
        gameOverCon.classList.add("d-none");
        modalCon.classList.remove("d-none");

        currentRoundEl.innerHTML = round;
        currentScoreEl.innerHTML = score;
        currentLifeEl.innerHTML = life;
    } else if (todo === "new") {
        isBonusRound = false;
        nextRoundCon.classList.add("d-none");
        modalCon.classList.add("d-none");
        if (round === world1 || round === world2) {
            startBonusRound();
            return; // stop here so normal round won't start yet
        }
        // prepare next round
        resetSettings("next");
        round++;
        difficulty();
        timeEl.innerHTML = gameTime + "s";
        grid.innerHTML = "";
        roundEl.innerHTML = round;
        selectionEl.innerHTML = selection + '/' + maxSelection;
        timerStart();
        createCard();
    }
}

// Bonus round every next difficulty
function startBonusRound() {
    console.log("🎯 BONUS ROUND START!");
    isBonusRound = true;
    gameInProgress = true;

    // Setup bonus mode visuals
    grid.innerHTML = "";
    runningCon.classList.remove("d-none");
    modalCon.classList.add("d-none");

    // Temporary visual cue
    mainCon.style.background = `
        radial-gradient(circle at 50% 50%, rgba(255, 255, 0, 0.3) 0%, transparent 60%), 
        linear-gradient(180deg, #ffb400 0%, #ff6a00 100%)`;

    // Reset and build grid
    if (round <= world1) {
        // world 1: 3x3
        oxCount = 9;
    } else if (round > world1 && round <= world2) {
        // world 2: 4x4
        boxCount = 16;
    } else {
        // later rounds: 5 columns (wider)
        boxCount = 25;
    }
    treasureCount = 6; // more treasures
    maxSelection = 999; // effectively infinite
    selection = 0;
    gameTime = bonusDuration;
    createBonusGrid();

    // Start countdown
    stopTimer();
    timerInterval = setInterval(() => {
        gameTime--;
        timeEl.innerHTML = gameTime + "s";
        if (gameTime <= 0) {
            endBonusRound();
        }
    }, 1000);

    // UI setup
    roundEl.innerHTML = "BONUS";
    lifeEl.innerHTML = life;
    scoreEl.innerHTML = score;
    selectionEl.innerHTML = "∞";
}

// Retry function - Allows player to retry current round after failure
function retry(todo) {
    if (todo === "display") {
        // Pause timer and freeze interactions
        stopTimer();
        gameInProgress = false;

        retryRoundCon.classList.remove("d-none");
        gameOverCon.classList.add("d-none");
        modalCon.classList.remove("d-none");

        retryRoundEl.innerHTML = round;
        retryScoreEl.innerHTML = score;
        retryLifeEl.innerHTML = life;
    } else if (todo === "new") {
        retryRoundCon.classList.add("d-none");
        modalCon.classList.add("d-none");

        resetSettings("next");
        difficulty();
        grid.innerHTML = "";
        timeEl.innerHTML = gameTime + "s";
        roundEl.innerHTML = round;
        selectionEl.innerHTML = selection + '/' + maxSelection;
        createCard();
        // resume timer
        timerStart();
    }
}

// Game over function - Handles end game scenario
function gameOver() {
    // ensure timer is stopped and game flagged not running
    stopTimer();
    gameInProgress = false;

    gameOverCon.classList.remove("d-none");
    nextRoundCon.classList.add("d-none");
    modalCon.classList.remove("d-none");

    finalRoundEl.innerHTML = round;
    finalScoreEl.innerHTML = score;

    stopBGM();
    playGameOverSound();
    leaderboard("update") // Update leaderboard with final score
}

// ---- GAME MECHANICS FUNCTIONS ----

// Create card function - Generates the game grid and handles click events
function createCard() {
    // Use treasureCount rather than hard-coded '2'
    // ensure unique positions and avoid collisions
    treasurePosition = [];
    extraLifePosition = [];
    extraXpPosition = [];

    // choose treasure positions
    treasurePosition = ensureUniqueRandom(treasureCount, boxCount);

    const used = new Set(treasurePosition);

    // extra life and xp have independent chance, but must avoid used positions
    if (Math.random() < 0.3) {
        const pos = getUniquePosition(used, boxCount);
        if (pos !== null) { extraLifePosition.push(pos); used.add(pos); }
    }

    if (Math.random() < 0.3) {
        const pos = getUniquePosition(used, boxCount);
        if (pos !== null) { extraXpPosition.push(pos); used.add(pos); }
    }

    cheatCode();
    // Draw grid
    for (let i = 0; i < boxCount; i++) {
        const card = document.createElement("div");
        card.classList.add("col", "m-1");
        card.setAttribute('role', 'button');
        grid.appendChild(card);

        // Click handler for each card - Main gameplay interaction
        card.onclick = function () {
            if (!gameInProgress) return;
            if (card.hasAttribute("clicked")) return;
            card.setAttribute("clicked", "true");
            selection++;
            selectionEl.innerHTML = selection + '/' + maxSelection;
            
            setTimeout(() => {
            if (treasurePosition.includes(i)) {
                card.style.backgroundImage = `url('images/coin.gif?${Date.now()}')`;
                playCoinSound();

                combo++;
                comboMultiplier = 1 + combo * 0.5; // e.g. combo=1→1.5x, combo=2→2x, etc.
                let gainedXP = Math.floor(100 * comboMultiplier);
                score += gainedXP;

                // Floating combo text (visual feedback)
                const floatText = document.createElement("span");
                floatText.textContent = `🔥 +${gainedXP} XP (x${comboMultiplier.toFixed(1)})`;
                floatText.style.position = "absolute";
                floatText.style.color = "gold";
                floatText.style.fontWeight = "bold";
                floatText.style.transform = "translateY(-10px)";
                floatText.style.transition = "0.5s ease-out";
                card.appendChild(floatText);
                setTimeout(() => floatText.style.opacity = "0", 300);
                setTimeout(() => floatText.remove(), 800);

                scoreEl.innerHTML = score;
            } else if (extraLifePosition.includes(i)) {
                card.style.backgroundImage = `url('images/1up.gif?${Date.now()}')`;
                playExtraLifeSound();
                updateLife(1);
            } else if (extraXpPosition.includes(i)) {
                card.style.backgroundImage = `url('images/xp.gif?${Date.now()}')`;
                playExtraLifeSound();
                score += 250;
                scoreEl.innerHTML = score;
            } else {
                card.style.backgroundImage = `url('images/wrong.gif?${Date.now()}')`;
                playWrongSound();
                combo = 0;
                comboMultiplier = 1;
            }

            guessedPosition.push(i);
            if (selection >= maxSelection) checkEndRound();
                
            }, 100);
        }
    }
}

// Create bonus card function
function createBonusGrid() {
    treasurePosition = ensureUniqueRandom(treasureCount, boxCount);

    for (let i = 0; i < boxCount; i++) {
        const card = document.createElement("div");
        card.classList.add("col", "m-1");
        card.style.cursor = 'pointer';
        card.style.backgroundImage = "url('images/box.png')";
        grid.appendChild(card);

        card.onclick = function () {
            if (!isBonusRound) return;

            // instant reaction, no blocking
            if (treasurePosition.includes(i)) {
                card.style.backgroundImage = `url('images/coin.gif?${Date.now()}')`;
                playCoinSound();
                score += 150;
                scoreEl.innerHTML = score;

                // small feedback
                card.style.transition = "transform 0.1s ease";
                card.style.transform = "scale(1.2)";
                setTimeout(() => {
                    card.style.transform = "scale(1)";
                    card.style.backgroundImage = "url('images/box.png')";
                }, 200);

                // regenerate treasures dynamically for chaos mode
                treasurePosition = ensureUniqueRandom(treasureCount, boxCount);
            }else{
                card.style.backgroundImage = `url('images/wrong.gif?${Date.now()}')`;
                playWrongSound();
                setTimeout(() => {
                    card.style.transform = "scale(1)";
                    card.style.backgroundImage = "url('images/box.png')";
                }, 200);
                treasurePosition = ensureUniqueRandom(treasureCount, boxCount);
            }
        };

    }
}

// Check end round - Determines if round should end and what happens next
function checkEndRound() {
    // Stop the timer immediately and freeze interactions
    stopTimer();
    gameInProgress = false;

    if (life <= 0) return gameOver();
    if (gameTime <= 0) {
        checkIfGuessed();
        if (isGuessed) return nextRound("display");
        updateLife(-1);
        if (life <= 0) return gameOver();
        else return retry("display");
    }

    if (selection >= maxSelection) checkIfGuessed();
    if (!isGuessed) {
        updateLife(-1);
        if (life <= 0) return gameOver();
        else return retry("display");
    } else {
        return nextRound("display");
    }
}

// Check if guessed - Validates if player found any treasure or extra life
function checkIfGuessed() {
    if (guessedPosition.some(el => treasurePosition.includes(el) || extraLifePosition.includes(el))) {
        isGuessed = true;
    } else {
        isGuessed = false;
    }
}

function endBonusRound() {
    stopTimer();
    isBonusRound = false;
    gameInProgress = false;
    grid.innerHTML = "";
    mainCon.style.background = ""; // reset background
    alert("Bonus Round Over! +XP earned!");

    // Continue to next real round
    round++;
    difficulty();
    resetSettings("next");
    timeEl.innerHTML = gameTime + "s";
    createCard();
    timerStart();
}


// Update life function - Modifies player life count
function updateLife(change) {
    life += change;
    lifeEl.innerHTML = life;
}

// ---- DIFFICULTY FUNCTIONS ----

// Difficulty function - Adjusts game parameters based on current round
function difficulty() {
    // Adjust difficulty based on round thresholds
    if (round <= world1) {
        // world 1: 3x3
        boxCount = 9;
        grid.classList.remove("row-cols-5", "row-col-7");
        grid.classList.add("row-cols-4");
        treasureCount = 2;
        maxSelection = 2;
        gameTime = 10;
    } else if (round > world1 && round <= world2) {
        // world 2: 4x4
        if(round == world1+1)
            circleEffect();
        treasureCount = 3;
        maxSelection = 3;
        boxCount = 16;
        grid.classList.remove("row-cols-4", "row-cols-6");
        grid.classList.add("row-cols-5");

        setTimeout(() => {
            gameTime = 15;
            selectionEl.innerHTML = selection + "/" + maxSelection;
            bodyCon.style.backgroundImage = "url('images/bg2.gif')";
            gameCon.style.background = "url('images/world2bg.png')";
            gameCon.style.backgroundSize = "cover";
            mainCon.style.background = `
          radial-gradient(ellipse at 20% 30%, rgba(80, 243, 255, 0.25) 0%, transparent 50%), 
          radial-gradient(ellipse at 70% 60%, rgba(100, 237, 255, 0.2) 0%, transparent 60%), 
          linear-gradient(180deg, #0a303a 0%, #002122 100%)`;
            mainCon.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat, repeat";
            mainCon.style.backgroundSize = "auto, auto, auto, 32px 32px";
        }, 500);
    } else {
        // later rounds: 5 columns (wider)
        if(round == world2+1)
            circleEffect();
        treasureCount = 4;
        maxSelection = 4;
        boxCount = 25;
        grid.classList.remove("row-cols-4", "row-cols-5");
        grid.classList.add("row-cols-6");
        setTimeout(() => { gameTime = 18; }, 500);
    }
}

// ---- TIMER FUNCTIONS ----

// Timer start function - Begins countdown for current round
function timerStart() {
    if (!gameInProgress) return;
    // Ensure no multiple intervals
    stopTimer();
    timeEl.innerHTML = gameTime + "s";
    timerInterval = setInterval(() => {
        gameTime--;
        if (gameTime < 0) gameTime = 0;
        timeEl.innerHTML = gameTime + "s";
        if (gameTime <= 0) {
            stopTimer();
            checkEndRound();
        }
    }, 1000);
}

// Stop timer function - Clears timer interval
function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ---- AUDIO FUNCTIONS ----

// Background music controls
function playBGM() {
    try { bgm.currentTime = 0; bgm.play(); }
    catch (err) { console.log("BGM blocked:", err); }
}

function stopBGM() {
    try { bgm.pause(); bgm.currentTime = 0; }
    catch (e) { }
}

// Menu music controls
function playMenuSound() {
    try { menuSound.currentTime = 0; menuSound.play(); }
    catch (err) { console.log("Menu sound blocked:", err); }
}

function stopMenuSound() {
    try { menuSound.pause(); menuSound.currentTime = 0; }
    catch (e) { }
}

// Sound effect functions
function playExtraLifeSound() {
    try { const s = extraLifeSound.cloneNode(); s.play(); }
    catch (e) { }
}

function playCoinSound() {
    try { const s = coinSound.cloneNode(); s.volume = 0.5; s.play(); }
    catch (e) { }
}

function playGameOverSound() {
    try { const s = gameOverSound.cloneNode(); s.play(); }
    catch (e) { }
}

function playWrongSound() {
    try { const s = wrongSound.cloneNode(); s.play(); }
    catch (e) { }
}

function playOnHoverSound() {
    try { const s = onHoverSound.cloneNode(); s.play(); s.volume = 0.5; }
    catch (e) { }
}

function onHoverSFX(){
    for (let i = 0; i < allBtn.length; i++) {
        allBtn[i].addEventListener("mouseover", () => {
            playOnHoverSound();
            console.log("hover");
        });
    }
}

// ---- VISUAL EFFECTS FUNCTIONS ----

// Circle effect - Visual transition animation between worlds
function circleEffect() {
    let defaultSize = 1100;
    for (let size = defaultSize; size >= 0; size -= 10) {
        setTimeout(() => {
            overlay.style.setProperty('--circle-size', `${size}px`);
        }, (defaultSize - size) * 0.5);
    }
    setTimeout(() => {
        for (let size = 0; size <= defaultSize; size += 10) {
            setTimeout(() => {
                overlay.style.setProperty('--circle-size', `${size}px`);
            }, (size - 0) * 0.5);
        }
    }, 700);
}

// Reset background function - Returns visuals to world 1 theme
function resetBackground() {
    // Reset to world 1
    bodyCon.style.backgroundImage = "url('images/bg1.gif')";
    gameCon.style.background = "url('images/world1bg.png')";
    gameCon.style.backgroundSize = "cover";
    mainCon.style.background = `
      radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), 
      radial-gradient(ellipse at 70% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%), 
      linear-gradient(180deg, #1E90FF 0%, #87CEEB 100%)`;
    mainCon.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat, repeat";
    mainCon.style.backgroundSize = "auto, auto, auto, 32px 32px";
}

// ---- USER INTERFACE FUNCTIONS ----

// View instructions function - Shows game instructions (appears to be incomplete)
function instructions(todo) {
    if (todo == "view") {
        instructionCon.classList.remove("d-none");
        modalCon.classList.remove("d-none");
        gameCon.classList.add("w-75");
        gameCon.classList.remove("w-25");
    } else {
        instructionCon.classList.add("d-none");
        modalCon.classList.add("d-none");
        gameCon.classList.add("w-25");
        gameCon.classList.remove("w-75");
    }
}

// Leaderboard function - Manages high score display and updates
function leaderboard(todo) {
    if (todo == "view") {
        leaderboardCon.classList.remove("d-none");
        modalCon.classList.remove("d-none");
        //initialize
        lbEntries.innerHTML = ``
        if (localStorage.length === 0) {
            lbEntries.innerHTML = `<p class="fw-bolder">No entry yet.</p>`;
        } else {
            lbEntries.innerHTML = ``
        }
        currentUserCon.innerHTML = `999. <p class="ms-2 text-warning">${playerNameInput.value} - 0XP</p>`;

        //top 10 player
        let entries = [];
        for (let i = 0; i < localStorage.length; i++) {
            let player = localStorage.key(i);
            let score = parseInt(localStorage.getItem(player), 10);
            entries.push({ player, score });
        }

        // sort descending
        entries.sort((a, b) => b.score - a.score);

        // display top 10
        entries.slice(0, 10).forEach((entry, idx) => {
            lbEntries.innerHTML += `<p class="fw-bolder">${idx + 1}. ${entry.player} - ${entry.score}XP</p>`;
        });
        //display players
        for (let i = 0; i < localStorage.length; i++) {
            let player = localStorage.key(i);
            let score = localStorage.getItem(player)

            // current player
            let currentPlayerEntry = entries.find(entry => entry.player === playerNameInput.value);
            let currentRank = entries.findIndex(entry => entry.player === playerNameInput.value) + 1;
            if (currentPlayerEntry) {
                currentUserCon.innerHTML = `${currentRank}. <p class="ms-2 text-warning">${currentPlayerEntry.player} - ${currentPlayerEntry.score}XP</p>`;
            }
        }
    } else if (todo == "update") {
        let existingScore = parseInt(localStorage.getItem(playerNameInput.value) || "0", 10);
        let currentScore = parseInt(scoreEl.innerHTML, 10);

        if(currentScore > existingScore){
            localStorage.setItem(playerNameInput.value, currentScore);
        }
    } else {
        //close
        leaderboardCon.classList.add("d-none");
        modalCon.classList.add("d-none");
    }
}

// ---- UTILITY FUNCTIONS ----

// Reset settings function - Resets game state variables
function resetSettings(todo) {
    if (todo === "new") {
        stopTimer();
        gameTime = 10;
        timerInterval = null;
        score = 0;
        round = 1;
        maxSelection = 2;
        selection = 0;
        life = 2;
        treasurePosition = [];
        guessedPosition = [];
        extraLifePosition = [];
        extraXpPosition = [];
        treasureCount = 2;
        isGuessed = false;
        boxCount = 9;
        gameInProgress = false;
        grid.innerHTML = "";
        combo = 0;
        comboMultiplier = 1;

        // reset layout classes (assume grid uses bootstrap row-cols-X)
        grid.classList.remove("row-cols-4", "row-cols-5", "row-cols-6");
    } else if (todo === "next") {
        // Prepare for next round, keep score and round
        stopTimer();
        timerInterval = null;
        selection = 0;
        treasurePosition = [];
        guessedPosition = [];
        extraLifePosition = [];
        extraXpPosition = [];
        isGuessed = false;
        gameInProgress = true;
        grid.innerHTML = "";
        combo = 0;
        comboMultiplier = 1;
    }
}

// Ensure unique random function - Generates array of unique random positions
function ensureUniqueRandom(count, max) {
    // returns an array of `count` unique integers from 0..max-1
    const set = new Set();
    while (set.size < Math.min(count, max)) {
        set.add(Math.floor(Math.random() * max));
    }
    return Array.from(set);
}

// Get unique position function - Finds single unused position
function getUniquePosition(excludeSet, max) {
    // returns a single position not in excludeSet
    if (excludeSet.size >= max) return null;
    let pos;
    do { pos = Math.floor(Math.random() * max); } while (excludeSet.has(pos));
    return pos;
}

// Player function - Generates random player name
function player() {
    playerNumber = Math.floor(Math.random() * 10000);
    playerNameInput.value = "Player-" + playerNumber;
}

// Display Item in the Box
function cheatCode() {
    let itemPosition = []
    for (let i = 0; i < boxCount; i++) {
        if(treasurePosition.includes(i)){
            itemPosition.push(1)
        }else if(extraLifePosition.includes(i)){
            itemPosition.push(2)
        }else if(extraXpPosition.includes(i)){
            itemPosition.push(3)
        }else{
            itemPosition.push(0)
        }
    }
    console.log("=======================")
    let size = Math.sqrt(boxCount);
    for (let r = 0; r < size; r++) {
        let row = itemPosition.slice(r * size, (r + 1) * size);
        console.log("Row " + (r + 1) + ":", row);
    }
}