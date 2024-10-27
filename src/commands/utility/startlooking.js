import { SlashCommandBuilder } from "discord.js";

import * as fs from "node:fs";
import { sleep } from "../../common/time.js";

const FILE_CONFIG = "src/data/config.json";
const FILE_POSTS = "src/data/biz.json";

export default {
  data: new SlashCommandBuilder()
    .setName("startlooking")
    .setDescription('Starts sending a messages from biz to this channel until "stop".'),

  async execute(interaction) {
    await interaction.reply("Started looking! I will send messages from biz until you say `stop`.");

    let dotCount = 0;
    let loadingMessage = null;
    let counter = -1;

    try {
      // Load the last message date from the config file and set a default value of 5 minutes ago
      let lastMessageDateUTC = loadLastMessageDateUTC() || Math.floor(new Date().getTime() / 1000) - 5 * 60;

      while (await stopLooking(interaction)) {
        if (counter % 15 === 0 || counter === -1) {
          console.log("Looking for new posts..." + new Date().toLocaleTimeString());
          lastMessageDateUTC = await potentialPosts(lastMessageDateUTC, interaction, loadingMessage);
        }

        if (counter % 300 === 0) {
          if (loadingMessage && !loadingMessage.deleted) {
            dotCount = (dotCount + 2) % 5;
            const dots = ".".repeat(dotCount);
            await loadingMessage.edit(`Loading.${dots}  last update: ${new Date().toLocaleTimeString()}`);
          } else {
            loadingMessage = await interaction.channel.send(`Loading  last update: ${new Date().toLocaleTimeString()}`);
            dotCount = 1;
          }

          counter = 0;
        }

        await sleep(1000);
        counter++;
      }
    } catch (error) {
      console.error("Error in the looking loop:", error);
      interaction.channel.send("An error occurred, stopping looking...");
    }

    interaction.channel.send("Detected 'stop' in recent messages. Stopped looking.");
  },
};

const stopLooking = async (interaction) => {
  const recentMessages = await interaction.channel.messages.fetch({ limit: 1 });

  const result = recentMessages.find((message) => {
    if (message.content.toLowerCase() === "stop" && !message.author.toString().includes("BeefWifHIV#")) {
      return true;
    }
  });

  return result ? false : true;
};

const potentialPosts = async (lastMessageDateUTC, interaction, loadingMessage) => {
  const data = JSON.parse(fs.readFileSync(FILE_POSTS, "utf-8"));

  const newPosts = data.posts?.filter((post) => post.dateUTC > lastMessageDateUTC);

  let messageContent = "";
  const maxLength = 2000;

  if (!newPosts || newPosts?.length === 0) {
    return lastMessageDateUTC;
  }

  // Format the message content

  await interaction.channel.send(`\n# --------------------------------------\n`);

  for (const post of newPosts) {
    lastMessageDateUTC = post.dateUTC > lastMessageDateUTC ? post.dateUTC : lastMessageDateUTC;

    post.matchedPatterns = post.matchedPatterns?.sort((a, b) => b.length - a.length);

    post.matchedKeywords.forEach((pattern) => {
      const regex = new RegExp(`(?<!\\*)(${pattern})(?!\\*)`, "gi");

      post.postMessage = post.postMessage?.replace(regex, "__**$1**__");
      post.postFileText = post.postFileText?.replace(regex, "__**$1**__");
    });

    let messagePart = "";
    messagePart += `### New post detected\n`;
    messagePart += `--------------------------------------\n`;
    if (post.matchedKeywords?.length > 0) messagePart += `**Keywords:** __${post.matchedKeywords.join(", ")}__\n`;
    if (post.matchedPatterns?.length > 0) messagePart += `**Pattern:** __${post.matchedPatterns.join(", ")}__\n`;
    messagePart += `**Link:** <${post.postLink}>\n`;
    messagePart += `**Time:** ${post.dateTime}\n`;
    if (post.postFileText) messagePart += `**FileText:** ${post.postFileText}\n`;
    messagePart += `**Message:** ${post.postMessage}\n`;

    // Check if adding the new message part would exceed the limit
    if (messageContent.length + messagePart.length > maxLength) {
      // Send the current message content and reset
      console.log("Sending message part:", messagePart);
      await interaction.channel.send(messageContent);
      messageContent = "";
    } else {
      messageContent += messagePart;
    }
  }

  // Send the entire message at once
  console.log("Sending message content:", messageContent);
  if (messageContent.trim().length > 0) await interaction.channel.send(messageContent);

  updateLastMessageDateUTC(lastMessageDateUTC);

  return lastMessageDateUTC;
};

const updateLastMessageDateUTC = (lastMessageDateUTC) => {
  const data = JSON.parse(fs.readFileSync(FILE_CONFIG, "utf-8"));
  data.biz.lastMessageDateUTC = lastMessageDateUTC;
  fs.writeFileSync(FILE_CONFIG, JSON.stringify(data, null, 2));
};

const loadLastMessageDateUTC = () => {
  const data = JSON.parse(fs.readFileSync(FILE_CONFIG, "utf-8"));
  return data.biz.lastMessageDateUTC;
};
