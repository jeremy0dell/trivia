#!/usr/bin/env node

/**
 * Import a trivia game from a JSON file into the database.
 * 
 * Usage:
 *   npm run import-game games/my-game.json          # Import to dev
 *   npm run import-game:prod games/my-game.json    # Import to production
 * 
 * Or directly:
 *   node scripts/import-game.js games/my-game.json
 *   CONVEX_DEPLOY_KEY=your-key node scripts/import-game.js games/my-game.json --prod
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const args = process.argv.slice(2);
const isProd = args.includes("--prod");
const jsonPath = args.find(arg => !arg.startsWith("--"));

if (!jsonPath) {
  console.error("❌ Usage: npm run import-game <path-to-game.json>");
  console.error("");
  console.error("Example:");
  console.error("  npm run import-game games/my-game.json");
  console.error("  npm run import-game:prod games/my-game.json");
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), jsonPath);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

let gameData;
try {
  const fileContent = fs.readFileSync(fullPath, "utf8");
  gameData = JSON.parse(fileContent);
} catch (error) {
  console.error(`❌ Failed to parse JSON file: ${error.message}`);
  process.exit(1);
}

// Validate required fields
const requiredFields = ["joinCode", "title", "rounds"];
for (const field of requiredFields) {
  if (!gameData[field]) {
    console.error(`❌ Missing required field: "${field}"`);
    process.exit(1);
  }
}

if (!Array.isArray(gameData.rounds) || gameData.rounds.length === 0) {
  console.error("❌ Game must have at least one round");
  process.exit(1);
}

for (let i = 0; i < gameData.rounds.length; i++) {
  const round = gameData.rounds[i];
  if (!round.title || !round.type || !Array.isArray(round.questions)) {
    console.error(`❌ Round ${i + 1} is missing required fields (title, type, questions)`);
    process.exit(1);
  }
  
  for (let j = 0; j < round.questions.length; j++) {
    const q = round.questions[j];
    if (!q.prompt || !q.type || !q.correctAnswer || q.points === undefined) {
      console.error(`❌ Question ${j + 1} in Round ${i + 1} is missing required fields (prompt, type, correctAnswer, points)`);
      process.exit(1);
    }
  }
}

const totalQuestions = gameData.rounds.reduce((sum, r) => sum + r.questions.length, 0);

console.log("");
console.log("📋 Game Summary:");
console.log(`   Title: ${gameData.title}`);
console.log(`   Join Code: ${gameData.joinCode}`);
console.log(`   Rounds: ${gameData.rounds.length}`);
console.log(`   Questions: ${totalQuestions}`);
console.log(`   Target: ${isProd ? "🔴 PRODUCTION" : "🟢 Development"}`);
console.log("");

// Escape JSON for shell
const escapedJson = JSON.stringify(gameData).replace(/'/g, "'\\''");

const command = isProd
  ? `npx convex run seed:importGame --prod '{"game": ${escapedJson}}'`
  : `npx convex run seed:importGame '{"game": ${escapedJson}}'`;

try {
  console.log("⏳ Importing game...");
  const result = execSync(command, { 
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large games
  });
  
  console.log(result);
  console.log("✅ Import complete!");
} catch (error) {
  console.error("❌ Import failed:");
  console.error(error.stderr || error.message);
  process.exit(1);
}

