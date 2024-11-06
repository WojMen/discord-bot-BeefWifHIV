import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Interaction,
  TextChannel,
  ChatInputCommandInteraction,
} from "discord.js";
import logger from "./common/logger.js";
import dotenv from "dotenv";
import startEthGweiMonitoring from "./common/startEthGweiMonitoring.js";

// Load environment variables
dotenv.config({ path: ".env" });

const CONFIG_FILE_PATH = "src/data/lastCommand.json";

// Extend the Client to include commands collection
interface Command {
  data: { name: string };
  execute: (interaction: Interaction) => Promise<void>;
}

interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

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
    logger.error("Error loading commands:", error);
  }
})();

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user?.tag}`);

  startEthGweiMonitoring(client);
  console.log(`Starting ping gwei thresholds`);

  const lastCommandData = fs.readJsonSync(CONFIG_FILE_PATH);

  console.log("Restarting previous commands...");
  console.log(lastCommandData);

  // #TODO
  // add interface for last commands to rerun after restart
  // lastCommandsData.forEach(async (lastCommandData: { channelId: string; commandName: string; seconds: number }) => {

  if (lastCommandData && lastCommandData.channelId && lastCommandData.commandName) {
    const channel = await client.channels.fetch(lastCommandData.channelId);
    const command = client.commands.get(lastCommandData.commandName);

    if (!(channel instanceof TextChannel) || !command) return;

    console.log(`Restarting get-biz-posts in channel: ${channel.id}`);

    command.execute({
      channel,
      options: { getNumber: () => lastCommandData.seconds },
      reply: async (message: string) => channel.send(message),
    } as unknown as ChatInputCommandInteraction);
  }
  // });
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
    logger.error("Error executing command:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
    } else {
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  }
});
