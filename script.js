// mastermind.js
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Game settings
const CODE_LENGTH = 4;
const COLORS = ["1", "2", "3", "4", "5"]; 
const MAX_TURNS = 10;

// Generate random secret code like ["3","1","4","2"]
function generateSecret() {
  const secret = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    const pick = COLORS[Math.floor(Math.random() * COLORS.length)];
    secret.push(pick);
  }
  return secret;
}

/**
 * Returns feedback { black, white }
 * black = correct symbol + position
 * white = correct symbol wrong position
 */
function checkGuess(secret, guess) {
  let black = 0;
  let white = 0;

  const secretLeft = [];
  const guessLeft = [];

  // 1) Count blacks and collect leftovers
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      black++;
    } else {
      secretLeft.push(secret[i]);
      guessLeft.push(guess[i]);
    }
  }

  // 2) Count whites using frequency map
  const freq = {};
  for (const s of secretLeft) {
    freq[s] = (freq[s] || 0) + 1;
  }

  for (const g of guessLeft) {
    if (freq[g] > 0) {
      white++;
      freq[g]--;
    }
  }

  return { black, white };
}

// Validate input like "1234"
function parseGuess(input) {
  const trimmed = input.trim();
  if (trimmed.length !== CODE_LENGTH) return null;

  const arr = trimmed.split("");
  for (const ch of arr) {
    if (!COLORS.includes(ch)) return null;
  }
  return arr;
}

// Ask user for a guess
function ask(turn, secret) {
  rl.question(
    `Turn ${turn}/${MAX_TURNS} - Enter a ${CODE_LENGTH}-digit guess (${COLORS.join(
      ""
    )}): `,
    (answer) => {
      const guess = parseGuess(answer);

      if (!guess) {
        console.log(`Invalid guess. Example: 1234 using digits ${COLORS.join(",")}`);
        return ask(turn, secret);
      }

      const { black, white } = checkGuess(secret, guess);
      console.log(`Feedback: black=${black}, white=${white}\n`);

      if (black === CODE_LENGTH) {
        console.log("🎉 You cracked the code! You win!");
        console.log(`Secret was: ${secret.join("")}`);
        return rl.close();
      }

      if (turn >= MAX_TURNS) {
        console.log("💀 Out of turns. You lose.");
        console.log(`Secret was: ${secret.join("")}`);
        return rl.close();
      }

      ask(turn + 1, secret);
    }
  );
}

//

