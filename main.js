/* ==========================================================
   MASTER MIND — SUPER SIMPLE, STEP BY STEP EXPLANATIONS
   ==========================================================

   HOW TO PLAY (in plain words)
   - The computer makes a secret code: 4 colors in a row.
   - You try to guess the 4 colors in the right order.
   - After each guess you get:
       Black = correct color in the correct spot.
       White = correct color, but in the wrong spot.
   - You have 10 tries.
*/

/* --------------------------
   1) BASIC SETTINGS
   -------------------------- */

// These are the only colors the game uses.
// We use simple words and reuse them in CSS class names.
const COLORS = ["red", "green", "blue", "yellow", "purple", "orange"];

// The secret has 4 spots (like 4 holes).
const CODE_LENGTH = 4;

// You can try 10 times before the game resets.
const MAX_TRIES = 10;

/* --------------------------
   2) GAME STATE (memory)
   -------------------------- */

let secretCode = [];      // example: ["red","blue","blue","yellow"]
let selectedColor = null; // the color you clicked in the palette
let triesCount = 0;       // how many guesses you made

/* --------------------------
   3) HELPER FUNCTIONS
   -------------------------- */

// Pick a random item from COLORS (could repeat)
function pickRandomColor() {
  const i = Math.floor(Math.random() * COLORS.length);
  return COLORS[i];
}

// Make a brand new secret like ["green","green","red","blue"]
function makeSecret() {
  const code = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    code.push(pickRandomColor());
  }
  return code;
}

// Read the 4 slots and return their colors,
// empty slots are "" (empty string)
function readCurrentGuess() {
  const slots = document.querySelectorAll("#activeRow .slot");
  const colors = [];
  slots.forEach(slot => {
    // We store the chosen color inside data-color
    // If there is no color yet, we treat it as ""
    colors.push(slot.dataset.color || "");
  });
  return colors;
}

// Check if all 4 slots are filled with some color
function guessIsComplete(guess) {
  return guess.every(c => c !== "");
}

// Clear the 4 slots back to empty
function clearSlots() {
  const slots = document.querySelectorAll("#activeRow .slot");
  slots.forEach(slot => {
    slot.dataset.color = "";   // remove color name
    slot.className = "slot";   // remove any old color classes
  });
}

// Turn a color name into a CSS class name we already defined
// Example: "red" -> "c-red"
function colorClass(colorName) {
  return "c-" + colorName;
}

/* --------------------------
   4) SCORING THE GUESS
   --------------------------

   IMPORTANT: We do scoring in two steps so we don't count anything twice.

   Step A (Black):
     - Look at each position 0..3.
     - If guess color === secret color in the same spot, count 1 black.

   Step B (White):
     - For the colors that were NOT already counted as black,
       check if a guess color exists somewhere else in the secret.
     - If yes, count 1 white and mark both as used.
*/
function scoreGuess(guess, code) {
  let black = 0;
  let white = 0;

  // Keep track of which positions we already matched
  const usedGuess = Array(CODE_LENGTH).fill(false);
  const usedCode  = Array(CODE_LENGTH).fill(false);

  // Step A: count blacks (exact matches)
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] !== "" && guess[i] === code[i]) {
      black++;
      usedGuess[i] = true;
      usedCode[i] = true;
    }
  }

  // Step B: count whites (right color, wrong place)
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (usedGuess[i]) continue; // skip if we already used this spot
    for (let j = 0; j < CODE_LENGTH; j++) {
      if (usedCode[j]) continue; // skip used secret spots
      if (guess[i] !== "" && guess[i] === code[j]) {
        white++;
        usedGuess[i] = true;
        usedCode[j] = true;
        break; // move to next guess position
      }
    }
  }

  return { black, white };
}

/* --------------------------
   5) UI WIRING (click handlers)
   -------------------------- */

const palette = document.getElementById("palette");
const activeRow = document.getElementById("activeRow");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const log = document.getElementById("log");

// When you click a color in the palette, remember it.
// Also add a thick outline so you can see which color is selected.
palette.addEventListener("click", (event) => {
  const btn = event.target.closest(".color");
  if (!btn) return; // clicked outside a color

  // Remove old selection outline
  document.querySelectorAll(".color").forEach(c => c.classList.remove("selected"));

  selectedColor = btn.dataset.color; // e.g., "red"
  btn.classList.add("selected");
});

// When you click a slot (one of the 4 holes), put the selected color in it.
activeRow.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot) return; // clicked not on a slot
  if (!selectedColor) {
    alert("Pick a color first (top row).");
    return;
  }

  // Save the color name into the slot and update its look
  slot.dataset.color = selectedColor;
  slot.className = "slot " + colorClass(selectedColor);

  // Enable buttons if needed
  const guess = readCurrentGuess();
  clearBtn.disabled = !guess.some(c => c !== "");
  checkBtn.disabled = !guessIsComplete(guess);
});

// Clear button empties all 4 slots
clearBtn.addEventListener("click", () => {
  clearSlots();
  checkBtn.disabled = true;
  clearBtn.disabled = true;
});

// Check button scores your 4 colors and logs the result
checkBtn.addEventListener("click", () => {
  const guess = readCurrentGuess();
  if (!guessIsComplete(guess)) return; // safety

  const result = scoreGuess(guess, secretCode);
  triesCount++;

  // Make a simple sentence for the log
  const line = document.createElement("li");
  line.textContent = `Try ${triesCount}: ${guess.join(", ")} → Black ${result.black}, White ${result.white}`;
  log.prepend(line);

  if (result.black === CODE_LENGTH) {
    alert("You win! 🎉 New game starting.");
    startNewGame();
    return;
  }

  if (triesCount >= MAX_TRIES) {
    alert("Out of turns! The secret was: " + secretCode.join(", ") + ". New game starting.");
    startNewGame();
    return;
  }

  // Get ready for the next try: clear the 4 slots
  clearSlots();
  checkBtn.disabled = true;
  clearBtn.disabled = true;
});

/* --------------------------
   6) START / RESET THE GAME
   -------------------------- */

function startNewGame() {
  secretCode = makeSecret();
  triesCount = 0;
  clearSlots();
  checkBtn.disabled = true;
  clearBtn.disabled = true;
  log.innerHTML = "";
  // If you want to see the answer while learning, uncomment the line below:
  // console.log("Secret is:", secretCode.join(", "));
}

// When the page finishes loading, start the first game.
document.addEventListener("DOMContentLoaded", startNewGame);
