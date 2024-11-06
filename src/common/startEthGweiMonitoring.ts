import { Client, TextChannel } from "discord.js";
import getETHGwei from "./getETHGwei.js";
import logger from "./logger.js";
import fs from "fs-extra";

import { GweiThreshold } from "./types.js";

const CONFIG_FILE_PATH = "src/data/gweiThresholds.json";

const startEthGweiMonitoring = async (client: Client): Promise<void> => {
  try {
    setInterval(async () => {
      const data: GweiThreshold[] = fs.existsSync(CONFIG_FILE_PATH)
        ? JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"))
        : {};

      if ((data && data.length === 0) || Object.keys(data).length === 0) return;

      const gwei = Number(await getETHGwei());

      const filteredData = data.filter((threshold) => threshold.active === true && threshold.value > gwei);

      if (filteredData.length === 0) return;

      for (const threshold of filteredData) {
        const channel = await client.channels.fetch(threshold.channel);
        const user = threshold.user;
        const value = threshold.value;
        const createdAt = new Date(threshold.createdAt);
        const mentions = threshold.usersToNotify
          ?.map((mention) => (mention === "here" || mention === "everyone" ? `@${mention}` : `<@${mention}>`))
          .join(", ");

        let messageContent = "";
        if (mentions.length > 0) messageContent += `${mentions}, \n`;
        messageContent += `<@${user}>, the gas price is below your threshold of **${value}** Gwei!\n`;
        messageContent += `Current gas price: **${gwei}** Gwei.\n`;
        messageContent += `Created at: ${createdAt.toLocaleString()}`;

        if (channel instanceof TextChannel) {
          await channel.send(messageContent);
          threshold.active = false;
          threshold.finishedAt = new Date();
        }
      }

      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(data, null, 2));
    }, 5000);
  } catch (error) {
    logger.error("Error in the monitoring thresholds loop:", error);
  }

  return;
};

export default startEthGweiMonitoring;
