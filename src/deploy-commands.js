import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

// Define __dirname for ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

// Get all command folders from the "commands" directory
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

console.log(`Found ${commandFolders.length} command folders.`);

for (const folder of commandFolders) {
  // Get all command files in each folder
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  // Retrieve each command's data for deployments
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    console.log(`Found command at ${filePath}`);

    // Use dynamic import for ES module compatibility
    const command = await import(`file://${filePath}`);

    if ("data" in command.default && "execute" in command.default) {
      commands.push(command.default.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Initialize REST instance with token
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy the commands
(async () => {
  try {
    console.log(`Started refreshings ${commands.length} application (/) commands.`);

    // Use the put method to fully refresh all guild commands
    const data = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
