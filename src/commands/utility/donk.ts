import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("donk").setDescription("Replies with Donk!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("DONK!");
  },
};
