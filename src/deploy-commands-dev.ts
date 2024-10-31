import { REST, Routes, APIApplicationCommand } from "discord.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define __filename and __dirname for ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: any[] = [];

// Define the path to the "commands" directory
const foldersPath = path.join(__dirname, "commands");

(async () => {
  try {
    // Read all command folders from the "commands" directory
    const commandFolders = await fs.readdir(foldersPath);
    console.log(`Found ${commandFolders.length} command folders.`);

    for (const folder of commandFolders) {
      // Get all command files in each folder
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = (await fs.readdir(commandsPath)).filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js")
      );

      // Retrieve each command's data for deployments
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        console.log(`Found command at ${filePath}`);

        // Use dynamic import for ES module compatibility
        const commandModule = await import(`file://${filePath}`);
        const command = commandModule.default;

        // Check if the command has the required properties
        if ("data" in command && "execute" in command) {
          commands.push(command.data.toJSON());
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }

    // Initialize REST instance with token
    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);

    // Deploy the commands
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Use the put method to fully refresh all guild commands
    const data = (await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string),
      { body: commands }
    )) as APIApplicationCommand[];

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error("Error loading commands or deploying:", error);
  }
})();
