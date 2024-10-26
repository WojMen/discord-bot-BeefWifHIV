import { SlashCommandBuilder } from "discord.js";

import * as fs from "node:fs";
import { sleep } from "../../common/time.js";

export default {
  data: new SlashCommandBuilder()
    .setName("startlooking")
    .setDescription('Starts sending a message hour minute to this channel until "stop".'),

  async execute(interaction) {
    await interaction.reply("Started looking! I will send messages every hour until you say `stop`.");

    try {
      let counter = -1;
      let lastMessageDateUTC = 1729970833;

      while (await stopLooking(interaction)) {
        // await interaction.channel.send("I'm still looking...");

        if (counter % 60 === 0 || counter === -1) {
          console.log("Looking for new posts..." + new Date().toLocaleTimeString());
          lastMessageDateUTC = await potentialPosts(lastMessageDateUTC, interaction);

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

// const sleep = (ms) => {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// };

const stopLooking = async (interaction) => {
  const recentMessages = await interaction.channel.messages.fetch({ limit: 1 });

  const result = recentMessages.find((message) => {
    if (message.content.toLowerCase() === "stop" && !message.author.toString().includes("BeefWifHIV#")) {
      return true;
    }
  });

  return result ? false : true;
};

const potentialPosts = async (lastMessageDateUTC, interaction) => {
  const outputFile = "src/data/biz.json";

  const data = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

  const newPosts = data.posts.filter((post) => post.dateUTC > lastMessageDateUTC);

  let messageContent = "";
  const maxLength = 2000;

  if (newPosts.length === 0) {
    return lastMessageDateUTC;
  }

  await interaction.channel.send(`\n## --------------------------------------\n`);

  for (const post of newPosts) {
    lastMessageDateUTC = post.dateUTC > lastMessageDateUTC ? post.dateUTC : lastMessageDateUTC;

    post.matchedKeywords.forEach((element) => {
      post.postMessage = post.postMessage.toLowerCase().replace(element, `__**${element}**__`);
    });

    let messagePart = "";
    messagePart += `### New post detected, keywords: __${post.matchedKeywords.join(", ")}__\n`;
    messagePart += `--------------------------------------\n`;
    messagePart += `**Link:** <${post.postLink}>\n`;
    messagePart += `**Time:** ${post.dateTime}\n`;
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

  return lastMessageDateUTC;
};
