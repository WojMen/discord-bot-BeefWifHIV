import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { Client, Collection, Events, GatewayIntentBits, Interaction } from "discord.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Extend the Client to include commands collection
interface Command {
  data: { name: string };
  execute: (interaction: Interaction) => Promise<void>;
}

interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

// Create a new client instance with custom properties
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
}) as ExtendedClient;

client.commands = new Collection<string, Command>();

// Define __dirname using import.meta.url for compatibility with Node.js and TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foldersPath = path.join(__dirname, "./commands");

// Load commands asynchronously
(async () => {
  try {
    const commandFolders = await fs.readdir(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);

      // Check if commandsPath is a directory before reading its contents
      const stats = await fs.stat(commandsPath);
      if (stats.isDirectory()) {
        const commandFiles = (await fs.readdir(commandsPath)).filter((file) => file.endsWith(".ts"));

        for (const file of commandFiles) {
          const filePath = path.join(commandsPath, file);

          // Use dynamic import for ES module compatibility
          const command: Command = await import(`file://${filePath}`).then((mod) => mod.default);

          // Access the exported command from the module's default or named export
          if (command && typeof command.data === "object" && typeof command.execute === "function") {
            client.commands.set(command.data.name, command);
          } else {
            console.log(
              `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property or has invalid types.`
            );
          }
        }
      }
    }

    // Log in to Discord with your client's token
    const token = process.env.DISCORD_TOKEN;
    if (token) {
      client.login(token);
    } else {
      console.error("DISCORD_TOKEN is not set in environment variables.");
    }
  } catch (error) {
    console.error("Error loading commands:", error);
  }
})();

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
    } else {
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }
});
