import logger from "../common/logger.js";
import { CommandLog } from "../database/models/commandLog.js";
import { ICommandLog } from "../common/types.js";

export async function createCommandLog(commandLog: ICommandLog): Promise<CommandLog | []> {
  try {
    const newCommandLog = await CommandLog.create(commandLog);
    console.log("New command:", newCommandLog.toJSON());

    return newCommandLog;
  } catch (error) {
    logger.error("Unable to create command log:", error);
    return [];
  }
}

// type IGetCommandLog = {
//   userId: number;
//   channelId: number;
//   name: string;
//   active?: boolean;
// }

export async function getCommandLogs(
  userId: string,
  channelId: string,
  name: string,
  active: boolean = true
): Promise<CommandLog[]> {
  try {
    const commandLogs = await CommandLog.findAll({ where: { active, userId, channelId, name } });

    return commandLogs;
  } catch (error) {
    logger.error("Unable to get command logs:", error);
    return [];
  }
}

export async function getChannelCommandLogs(
  channelId: string,
  name: string,
  active: boolean = true
): Promise<CommandLog[]> {
  try {
    const commandLogs = await CommandLog.findAll({ where: { active, channelId, name } });

    return commandLogs;
  } catch (error) {
    logger.error("Unable to get command logs:", error);
    return [];
  }
}

export async function getCommandLogsAll(active: boolean = true): Promise<CommandLog[]> {
  try {
    const commandLogs = await CommandLog.findAll({ where: { active } });

    return commandLogs;
  } catch (error) {
    logger.error("Unable to get command logs:", error);
    return [];
  }
}

export async function updateCommandLog(commadId: number, parameters: any): Promise<void> {
  try {
    const isUpdated = await CommandLog.update({ parameters }, { where: { id: commadId } });

    if (isUpdated[0] === 0) {
      logger.error(`Unable to update commandLog with id ${commadId} and parameters ${parameters}`);
    }
  } catch (error) {
    logger.error(`Crash Unable to update commandLog with id ${commadId} and parameters ${parameters} `, error);
  }
}
