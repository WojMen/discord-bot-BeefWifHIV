import dotenv from "dotenv";

dotenv.config();
// Access environment variables
const clientId = process.env.CLIENT_ID;
const discordToken = process.env.DISCORD_TOKEN;

if (!discordToken) {
  console.error("DISCORD_TOKEN is not set in environment variables.");
} else {
  console.log("Loaded DISCORD_TOKEN:", discordToken);
}

console.log("Loaded CLIENT_ID:", clientId);
console.log("Loaded DISCORD_TOKEN:", discordToken);
