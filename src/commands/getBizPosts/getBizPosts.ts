import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel } from "discord.js";
import { sleep, getUnixTimeMinusSeconds } from "../../common/time.js";
import { getNewFilteredPosts } from "./getNewFilteredPosts.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import logger from "../../common/logger.js";
import { IBizPost } from "../../common/types.js";
import {
  createCommandLog,
  getChannelCommandLogs,
  getCommandLogs,
  updateCommandLog,
} from "../../services/commandLogsService.js";
import { CommandLog } from "../../database/models/commandLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LAST_COMMAND_FILE = path.join(__dirname, "../../data/lastCommand.json");

const COMMAND_NAME = "dev-get-biz-posts";

export default {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Starts sending messages from /biz/ to this channel until "stop".')
    .addNumberOption((option) =>
      option
        .setName("seconds")
        .setDescription("Specify the number of seconds for how far back to check.")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getNumber("seconds", false) || 900;
    await interaction.reply("Started looking! I will send messages from /biz/ until you say `stop`.");

    console.log(interaction.channelId);

    const resumeCommand = await getChannelCommandLogs(interaction.channelId, COMMAND_NAME);

    let commandData: CommandLog | [] = resumeCommand[0];

    if (commandData === undefined) {
      commandData = await createCommandLog({
        name: COMMAND_NAME,
        userId: interaction.user.id,
        channelId: interaction.channelId,
        parameters: { seconds: seconds },
        active: true,
      });

      if (!(commandData instanceof CommandLog)) {
        logger.error("Error while creating command log.");
        return;
      }
    }

    let lastMessage: Message | null = null;
    let counter = 20;
    let postTime = 0;

    try {
      let minPostTime = seconds > 60000 ? seconds : getUnixTimeMinusSeconds(seconds);

      while (await stopLooking(interaction)) {
        if (counter % 20 === 0) {
          console.log("Looking for new posts..." + new Date().toLocaleTimeString());

          [postTime, lastMessage] = await sendAavaiblePosts(minPostTime, interaction, lastMessage);

          if (postTime > minPostTime) {
            minPostTime = postTime;
            await updateCommandLog(commandData.id, { seconds: minPostTime });
          }

          counter = 0;
        }

        await sleep(1000);
        counter++;
      }
    } catch (error) {
      logger.error("Error in the looking loop:", error);
      if (interaction.channel instanceof TextChannel) {
        interaction.channel.send("An error occurred, stopping looking...");
        process.exit(1);
      }
    }

    if (interaction.channel instanceof TextChannel) {
      interaction.channel.send("Detected 'stop' in recent messages. Stopped looking.");
    }
  },
};

const stopLooking = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
  const recentMessages = await interaction.channel?.messages.fetch({ limit: 1 });

  const result = recentMessages?.find((message) => {
    if (message.content.toLowerCase() === "stop" && !message.author.tag.includes("BeefWifHIV")) {
      fs.writeFileSync(LAST_COMMAND_FILE, JSON.stringify({}, null, 2));

      return true;
    }
    return false;
  });

  return result ? false : true;
};

async function sendAavaiblePosts(
  seconds: number,
  interaction: ChatInputCommandInteraction,
  lastMessage: Message | null
): Promise<[number, Message | null]> {
  const newPosts: IBizPost[] = await getNewFilteredPosts(seconds);

  if (newPosts.length === 0) {
    if (!lastMessage) return [seconds, lastMessage];

    const messageLines = lastMessage.content.split("\n");
    messageLines.pop();
    const updatedTime = `-# Last updated: ${new Date().toLocaleTimeString()}`;
    const newContent = `${messageLines.join("\n")}\n${updatedTime}`;
    await lastMessage.edit(newContent);
    return [seconds, lastMessage];
  }

  const maxLength = 1975;
  let messageContent = "";

  for (const post of newPosts) {
    let messagePart = "";
    messagePart += `### New post detected\n`;
    messagePart += `--------------------------------------\n`;
    if (post.capcode) messagePart += `**Capcode:** ${post.capcode}\n`;

    if (post.matchedKeyWords && post.matchedKeyWords.length > 0) {
      const keyWordsHighlighted = post.matchedKeyWords.map((word) => `__**${word}**__`);
      messagePart += `**Keywords:** ${keyWordsHighlighted.join(", ")}\n`;
    }

    if (post?.matchedPatterns && post.matchedPatterns.length > 0) {
      const patternsHighlighted = post.matchedPatterns.map((pattern) => `__**${pattern}**__`);
      messagePart += `**Patterns:** ${patternsHighlighted.join(", ")}\n`;
    }

    messagePart += `**Link:** <${post.link}>\n`;
    messagePart += `**Time:** ${post.time}\n`;
    if (post.filename) messagePart += `**Filename:** ${post.filename}\n`;
    if (post.comment) messagePart += `**Comment:** ${post.comment}\n`;

    if (messageContent.length + messagePart.length > maxLength) {
      if (messageContent.length > 0) {
        console.log("Sending message part:", messagePart);
        if (interaction.channel instanceof TextChannel) {
          lastMessage = await interaction.channel.send(messageContent);
        }
        messageContent = "";
      } else {
        console.log("Sending message shorten part:", messagePart);
        const trimmedMessage = messagePart.substring(0, maxLength);
        if (interaction.channel instanceof TextChannel) {
          lastMessage = await interaction.channel.send(trimmedMessage);
        }
        messagePart = "";
      }
    } else {
      messageContent += messagePart;
    }
  }

  if (messageContent.length === 0) return [newPosts.slice(-1)[0].timeUNIX, lastMessage];

  console.log("Sending message content:", messageContent);
  messageContent += `-# Last updated: ${new Date().toLocaleTimeString()}`;
  if (interaction.channel instanceof TextChannel) {
    lastMessage = await interaction.channel.send(messageContent);
  }

  return [newPosts.slice(-1)[0].timeUNIX, lastMessage];
}
