import { SlashCommandBuilder } from "discord.js";

import * as fs from "node:fs";
import { sleep } from "../../common/time.js";

const FILE_CONFIG_PATH = "./config.json";
const FILE_POSTS_PATH = "src/data/biz.json";

export default {
  data: new SlashCommandBuilder()
    .setName("startlooking")
    .setDescription('Starts sending a messages from biz to this channel until "stop".'),

  async execute(interaction) {
    await interaction.reply("Started looking! I will send messages from biz until you say `stop`.");

    let lastMessage = null;
    let counter = -1;

    try {
      // Load the last message date from the config file and set a default value of 5 minutes ago
      let lastMessageDateUTC = loadLastMessageDateUTC();

      while (await stopLooking(interaction)) {
        if (counter % 15 === 0 || counter === -1) {
          console.log("Looking for new posts..." + new Date().toLocaleTimeString());
          [lastMessageDateUTC, lastMessage] = await potentialPosts(lastMessageDateUTC, interaction, lastMessage);

          counter = 0;
        }

        // loadingMessage = await interaction.channel.send(`Loading  last update: ${new Date().toLocaleTimeString()}`);

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

const potentialPosts = async (lastMessageDateUTC, interaction, lastMessage) => {
  const data = JSON.parse(fs.readFileSync(FILE_POSTS_PATH, "utf-8"));

  const newPosts = data.posts?.filter((post) => post.dateUTC > lastMessageDateUTC);

  let messageContent = "";
  const maxLength = 2000;

  // Check if there are no new posts
  // update user with last updated time

  if (!newPosts || newPosts?.length === 0) {
    if (!lastMessage) return [lastMessageDateUTC, null];

    const messageLines = lastMessage.content.split("\n");
    messageLines.pop();
    const updatedTime = `Last updated: ${new Date().toLocaleTimeString()}`;
    const newContent = `${messageLines.join("\n")}\n${updatedTime}`;
    await lastMessage.edit(newContent);

    return [lastMessageDateUTC, lastMessage];
  }

  //
  // Format the message content
  //

  await interaction.channel.send(`\n# --------------------------------------\n`);

  for (const post of newPosts) {
    lastMessageDateUTC = post.dateUTC > lastMessageDateUTC ? post.dateUTC : lastMessageDateUTC;

    //
    //  Highlight the matched keywords and patterns
    //
    post.matchedKeywords.forEach((pattern) => {
      const regex = new RegExp(`(?<!\\*)(${pattern})(?!\\*)`, "gi");

      post.postMessage = post.postMessage?.replace(regex, "__**$1**__");
      post.postFileText = post.postFileText?.replace(regex, "__**$1**__");
    });

    post.postMessage = highLightTokenAddress(post.postMessage, post.matchedPatterns);
    post.postFileText = highLightTokenAddress(post.postFileText, post.matchedPatterns);

    let messagePart = "";
    messagePart += `### New post detected\n`;
    messagePart += `--------------------------------------\n`;
    if (post.matchedKeywords?.length > 0) messagePart += `**Keywords:** __${post.matchedKeywords.join(", ")}__\n`;
    if (post.matchedPatterns?.length > 0) messagePart += `**Pattern:** __${post.matchedPatterns.join(", ")}__\n`;
    messagePart += `**Link:** <${post.postLink}>\n`;
    messagePart += `**Time:** ${post.dateTime}\n`;
    if (post.postFileText) messagePart += `**FileText:** ${post.postFileText}\n`;
    messagePart += `**Message:** ${post.postMessage || ""}\n`;

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

  console.log("Sending message content:", messageContent);
  messageContent += `Last updated: ${new Date().toLocaleTimeString()}`;
  lastMessage = await interaction.channel.send(messageContent);

  updateLastMessageDateUTC(lastMessageDateUTC);

  return [lastMessageDateUTC, lastMessage];
};

const updateLastMessageDateUTC = (lastMessageDateUTC) => {
  const data = JSON.parse(fs.readFileSync(FILE_CONFIG_PATH, "utf-8"));
  data.biz.lastMessageDateUTC = lastMessageDateUTC;

  fs.writeFileSync(FILE_CONFIG_PATH, JSON.stringify(data, null, 2));
};

const loadLastMessageDateUTC = () => {
  const data = JSON.parse(fs.readFileSync(FILE_CONFIG_PATH, "utf-8"));

  if (!data?.biz?.lastMessageDateUTC) {
    data.biz.lastMessageDateUTC = new Date().getTime() - 5 * 60 * 1000;
    fs.writeFileSync(FILE_CONFIG_PATH, JSON.stringify(data, null, 2));
  }

  return data.biz.lastMessageDateUTC;
};

const highLightTokenAddress = (text, patterns) => {
  if (patterns.length === 0 || text.length === 0) return text;

  const configPatterns = JSON.parse(fs.readFileSync(FILE_CONFIG_PATH, "utf-8")).biz.regexPatterns;
  const urlRegex = /https?:\/\/[^\s]+/g;

  // Replace URLs with a placeholder
  const urls = [];
  const textWithPlaceholders = text.replace(urlRegex, (url) => {
    urls.push(url); // Save each URL
    return "__URL_PLACEHOLDER__"; // Replace URL with placeholder
  });

  patterns.forEach((pattern) => {
    const patternRegexStr = configPatterns.find((p) => p.label === pattern)?.regex;
    if (!patternRegexStr) return;

    const patternRegex = new RegExp(`(?<!\\*)(${patternRegexStr})(?!\\*)`, "gi");

    // Apply highlighting to text with placeholders (but not inside URLs)
    text = textWithPlaceholders.replace(patternRegex, "__**$1**__");
  });

  // Restore URLs in place of placeholders
  let urlIndex = 0;
  text = text.replace(/__URL_PLACEHOLDER__/g, () => urls[urlIndex++]);

  return text;
};
