import { SlashCommandBuilder } from "discord.js";

import { sleep } from "../../common/time";

export default {
  data: new SlashCommandBuilder()
    .setName("startlooking")
    .setDescription('Starts sending a message hour minute to this channel until "stop".'),

  async execute(interaction) {
    await interaction.reply("Started looking! I will send messages every hour until you say `stop`.");

    try {
      while (await stopLooking(interaction)) {
        await interaction.channel.send("I'm still looking...");
        await sleep(60000 * 60);
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
      console.log(false);
      return true;
    }
  });
  console.log(result);
  return result ? false : true;
};
