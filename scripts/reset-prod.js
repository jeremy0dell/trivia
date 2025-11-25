#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n⚠️  WARNING: This will CLEAR and RESEED the PRODUCTION database!");
console.log("   All existing games, teams, rounds, questions, and answers will be DELETED.\n");

rl.question('Type "reset prod" to confirm: ', (answer) => {
  if (answer === "reset prod") {
    console.log("\n🗑️  Clearing production database...");
    try {
      execSync("npx convex run seed:clearDatabase --prod", { stdio: "inherit" });
      console.log("\n🌱 Seeding production database...");
      execSync("npx convex run seed:seedDatabase --prod", { stdio: "inherit" });
      console.log("\n✅ Production database reset complete!");
    } catch (error) {
      console.error("\n❌ Error resetting production database:", error.message);
      process.exit(1);
    }
  } else {
    console.log("\n❌ Cancelled. Database was NOT modified.");
  }
  rl.close();
});

