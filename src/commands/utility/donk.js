import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("donk").setDescription("Replies with Donk!"),
  async execute(interaction) {
    await interaction.reply("DONK!");
  },
};
