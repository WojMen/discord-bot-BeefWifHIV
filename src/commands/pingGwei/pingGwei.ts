import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import logger from "../../common/logger.js";
import { IGweiRequest } from "../../common/types.js";
import { createGweiRequest } from "../../services/gweiRequestService.js";
import { createCommandLog } from "../../services/commandLogsService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dev-ping-gwei")
    .setDescription("I will ping you when the gas price is below a certain threshold.")
    .addNumberOption((option) => option.setName("gwei").setDescription("Specify the gwei value").setRequired(true))
    .addStringOption((option) =>
      option.setName("notify").setDescription("Specify people to notify or role seperate by space").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const gwei = interaction.options.getNumber("gwei", true);
    const mentions = interaction.options.getString("notify", false) || "";

    try {
      const usersToNotify = mentions
        ? mentions
            .split(" ")
            .map((mention) => mention.replace(/[<@&>]/g, ""))
            .filter((v) => v !== "")
        : [];

      const gweiRequest: IGweiRequest = {
        value: gwei,
        userId: interaction.user.id,
        channelId: interaction.channelId,
        usersToNotify: usersToNotify,
        active: true,
      };

      const isCreated = await createGweiRequest(gweiRequest);
      if (isCreated) interaction.reply(`I will ping you when the gas price is below ${gwei} gwei.`);
    } catch (error) {
      logger.error("Error while writing to file:", error);
      if (interaction.channel instanceof TextChannel) {
        interaction.channel.send("An error occurred, while saving your action...");
      }
    }
  },
};
