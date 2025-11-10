

let secretCode = [];     
let selectedColor = null; 
let triesCount = 0;      

function pickRandomColor() {
  const i = Math.floor(Math.random() * COLORS.length);
  return COLORS[i];
}

function makeSecret() {
  const code = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    code.push(pickRandomColor());
  }
  return code;
}


function readCurrentGuess() {
  const slots = document.querySelectorAll("#activeRow .slot");
  const colors = [];
  slots.forEach(slot => {

    colors.push(slot.dataset.color || "");
  });
  return colors;

function guessIsComplete(guess) {
  return guess.every(c => c !== "");
}

function clearSlots() {
  const slots = document.querySelectorAll("#activeRow .slot");
  slots.forEach(slot => {
    slot.dataset.color = "";  
    slot.className = "slot";   
  });
}


function colorClass(colorName) {
  return "c-" + colorName;
}


function scoreGuess(guess, code) {
  let black = 0;
  let white = 0;

  const usedGuess = Array(CODE_LENGTH).fill(false);
  const usedCode  = Array(CODE_LENGTH).fill(false);

 
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] !== "" && guess[i] === code[i]) {
      black++;
      usedGuess[i] = true;
      usedCode[i] = true;
    }
  }

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (usedGuess[i]) continue; 
    for (let j = 0; j < CODE_LENGTH; j++) {
      if (usedCode[j]) continue; 
      if (guess[i] !== "" && guess[i] === code[j]) {
        white++;
        usedGuess[i] = true;
        usedCode[j] = true;
        break; 
      }
    }
  }

  return { black, white };
}



const palette = document.getElementById("palette");
const activeRow = document.getElementById("activeRow");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const log = document.getElementById("log");


palette.addEventListener("click", (event) => {
  const btn = event.target.closest(".color");
  if (!btn) return; 

 
  document.querySelectorAll(".color").forEach(c => c.classList.remove("selected"));

  selectedColor = btn.dataset.color; 
  btn.classList.add("selected");
});


activeRow.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot) return; 
  if (!selectedColor) {
    alert("Pick a color first (top row).");
    return;
  }

 
  slot.dataset.color = selectedColor;
  slot.className = "slot " + colorClass(selectedColor);

 
  const guess = readCurrentGuess();
  clearBtn.disabled = !guess.some(c => c !== "");
  checkBtn.disabled = !guessIsComplete(guess);
});


clearBtn.addEventListener("click", () => {
  clearSlots();
  checkBtn.disabled = true;
  clearBtn.disabled = true;
});


checkBtn.addEventListener("click", () => {
  const guess = readCurrentGuess();
  if (!guessIsComplete(guess)) return;

  const result = scoreGuess(guess, secretCode);
  triesCount++;

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

 
  clearSlots();
  checkBtn.disabled = true;
  clearBtn.disabled = true;
});


function startNewGame() {
  secretCode = makeSecret();
  triesCount = 0;
  clearSlots();
  checkBtn.disabled = true;
  clearBtn.disabled = true;
  log.innerHTML = "";

}

document.addEventListener("DOMContentLoaded", startNewGame);
