import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, VoiceChannel } from "discord.js";
import logger from "../../common/logger.js";
import getETHGwei from "../../common/getETHGwei.js";

export default {
  data: new SlashCommandBuilder()
    .setName("monitor-eth-gwei")
    .setDescription("Updates chosen channel with the latest ETH gas prices from etherscan.io.")
    .addStringOption((option) =>
      option.setName("channel-id").setDescription("Specify the channelID to update gas prices.").setRequired(true)
    
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channelId = interaction.options.getString("channel-id", true);
    await interaction.reply("Started monitoring! I will update gas prices in the specified channel.");

    try {
      await updateChannelName(channelId, interaction);

      const intervalId = setInterval(async () => {
        const shouldContinue = await stopLooking(interaction);
        if (!shouldContinue) {
          clearInterval(intervalId);
          if (interaction.channel instanceof TextChannel) {
            interaction.channel.send("Detected 'stop' in recent messages. Stopped monitoring.");
          }
          return;
        }

        await updateChannelName(channelId, interaction);
      }, 300000);
    } catch (error) {
      logger.error("Error in the monitoring loop:", error);
      if (interaction.channel instanceof TextChannel) {
        interaction.channel.send("An error occurred, stopping monitoring...");
      }
    }
  },
};

const updateChannelName = async (channelId: string, interaction: ChatInputCommandInteraction) => {
  const gwei = await getETHGwei();

  const channel = await interaction.guild?.channels.fetch(channelId);
  if (channel instanceof VoiceChannel) {
    console.log(`Current gas price (Propose): ${gwei} Gwei, ${new Date().toUTCString()} `);
    await channel.setName(`Gwei ETH ~ ${gwei}`);
  }
};

const stopLooking = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
  const recentMessages = await interaction.channel?.messages.fetch({ limit: 1 });

  const result = recentMessages?.find((message) => {
    if (message.content.toLowerCase() === "stop" && !message.author.tag.includes("BeefWifHIV")) {
      return true;
    }
    return false;
  });

  return result ? false : true;
};
