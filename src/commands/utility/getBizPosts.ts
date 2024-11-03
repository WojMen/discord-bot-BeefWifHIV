import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel } from "discord.js";
import { sleep, getUnixTimeMinusSeconds } from "../../common/time.js";
import { getNewFilteredPosts } from "../../common/getNewFilteredPosts.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

import { Post } from "../../common/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LAST_COMMAND_FILE = path.join(__dirname, "../../data/lastCommand.json");

export default {
  data: new SlashCommandBuilder()
    .setName("get-biz-posts")
    .setDescription('Starts sending messages from /biz/ to this channel until "stop".')
    .addNumberOption((option) =>
      option
        .setName("seconds")
        .setDescription("Specify the number of seconds for how far back to check.")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getNumber("seconds", true);
    await interaction.reply("Started looking! I will send messages from /biz/ until you say `stop`.");

    const commandData = {
      channelId: interaction.channelId,
      commandName: "get-biz-posts",
      seconds: seconds,
      date: new Date().toLocaleString(),
    };

    fs.writeFileSync(LAST_COMMAND_FILE, JSON.stringify(commandData, null, 2));

    let lastMessage: Message | null = null;
    let counter = 35;
    let postTime = 0;

    try {
      let minPostTime = seconds > 60000 ? seconds : getUnixTimeMinusSeconds(seconds || 900);

      while (await stopLooking(interaction)) {
        if (counter % 35 === 0) {
          console.log("Looking for new posts..." + new Date().toLocaleTimeString());

          [postTime, lastMessage] = await sendAavaiblePosts(minPostTime, interaction, lastMessage);

          if (postTime > minPostTime) {
            minPostTime = postTime;
            commandData.seconds = minPostTime;
            fs.writeFileSync(LAST_COMMAND_FILE, JSON.stringify(commandData, null, 2));
          }

          counter = 0;
        }

        await sleep(1000);
        counter++;
      }
    } catch (error) {
      console.error("Error in the looking loop:", error);
      if (interaction.channel instanceof TextChannel) {
        interaction.channel.send("An error occurred, stopping looking...");
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
  const newPosts: Post[] = await getNewFilteredPosts(seconds);

  if (newPosts.length === 0) {
    if (!lastMessage) return [seconds, lastMessage];

    const messageLines = lastMessage.content.split("\n");
    messageLines.pop();
    const updatedTime = `Last updated: ${new Date().toLocaleTimeString()}`;
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

    if (post.matchedKeyWords && post.matchedKeyWords.length > 0)
      messagePart += `**Keywords:** __${post.matchedKeyWords.join(", ")}__\n`;
    if (post?.matchedPatterns && post.matchedPatterns.length > 0)
      messagePart += `**Patterns:** __${post.matchedPatterns.join(", ")}__\n`;

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
  messageContent += `Last updated: ${new Date().toLocaleTimeString()}`;
  if (interaction.channel instanceof TextChannel) {
    lastMessage = await interaction.channel.send(messageContent);
  }

  return [newPosts.slice(-1)[0].timeUNIX, lastMessage];
}
