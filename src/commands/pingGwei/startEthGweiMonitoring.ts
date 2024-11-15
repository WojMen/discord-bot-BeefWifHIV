import { Client, TextChannel } from "discord.js";
import getETHGwei from "../../common/getETHGwei.js";
import logger from "../../common/logger.js";
import { getGweiRequests, updateStatusGweiRequests } from "../../services/gweiRequestService.js";
import { GweiRequest } from "../../database/models/gweiRequest.js";

const startEthGweiMonitoring = async (client: Client): Promise<void> => {
  try {
    setInterval(async () => {
      const data: GweiRequest[] = await getGweiRequests();

      if ((data && data.length === 0) || Object.keys(data).length === 0) return;

      const gwei = Number(await getETHGwei());

      const filteredData = data.filter((threshold) => threshold.active === true && threshold.value > gwei);

      if (filteredData.length === 0) return;

      const updatedData = [];

      for (const threshold of filteredData) {
        const channel = await client.channels.fetch(threshold.channelId);
        const user = threshold.userId;
        const value = threshold.value;
        const createdAt = new Date(threshold.createdAt);
        const mentions =
          threshold.usersToNotify
            ?.map((mention) => (mention === "here" || mention === "everyone" ? `@${mention}` : `<@${mention}>`))
            .join(", ") || [];

        let messageContent = "";
        if (mentions.length > 0) messageContent += `${mentions}, \n`;
        messageContent += `<@${user}>, the gas price is below your threshold of **${value}** Gwei!\n`;
        messageContent += `Current gas price: **${gwei}** Gwei.\n`;
        messageContent += `Created at: ${createdAt.toLocaleString()}`;

        if (channel && channel instanceof TextChannel) {
          await channel.send(messageContent);

          updatedData.push(threshold.id);
        }
      }

      if (updatedData.length > 0) await updateStatusGweiRequests(updatedData);
    }, 5000);
  } catch (error) {
    logger.error("Error in the monitoring thresholds loop:", error);
  }

  return;
};

export default startEthGweiMonitoring;
