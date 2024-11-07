import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import logger from "../../common/logger.js";
import fs from "fs-extra";
import { GweiThreshold } from "../../common/types.js";

const CONFIG_FILE_PATH = "src/data/gweiThresholds.json";

export default {
  data: new SlashCommandBuilder()
    .setName("ping-gwei")
    .setDescription("I will ping you when the gas price is below a certain threshold.")
    .addNumberOption((option) => option.setName("gwei").setDescription("Specify the gwei value").setRequired(true))
    .addStringOption((option) =>
      option.setName("notify").setDescription("Specify people to notify or role seperate by space").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const gwei = interaction.options.getNumber("gwei", true);
    const mentions = interaction.options.getString("notify", false) || "";
    await interaction.reply("Started monitoring! I will ping you when the gas price is below a certain threshold.");
    console.log(mentions);

    try {
      const usersToNotify = mentions
        ? mentions
            .split(" ")
            .map((mention) => mention.replace(/[<@&>]/g, ""))
            .filter((v) => v !== "") // Remove <@ & > characters
        : [];

      const threshold: GweiThreshold = {
        id: Math.random().toString(36).substring(12),
        value: gwei,
        user: interaction.user.id,
        channel: interaction.channelId,
        usersToNotify: usersToNotify,
        createdAt: new Date(),
        finishedAt: undefined,
        active: true,
      };

      const existingData: GweiThreshold[] = fs.existsSync(CONFIG_FILE_PATH)
        ? JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"))
        : [];

      existingData.push(threshold);

      // Write the updated data back to the file
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(existingData, null, 2));
    } catch (error) {
      logger.error("Error while writing to file:", error);
      if (interaction.channel instanceof TextChannel) {
        interaction.channel.send("An error occurred, while saving your action...");
      }
    }
  },
};
