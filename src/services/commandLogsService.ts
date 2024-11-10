import logger from "../common/logger.js";
import { CommandLog } from "../database/models/commandLog.js";
import { ICommandLog } from "../common/types.js";

export async function createCommandLog(commandLog: ICommandLog): Promise<void> {
  try {
    const newCommandLog = await CommandLog.create(commandLog);
    console.log("New command:", newCommandLog.toJSON());
  } catch (error) {
    logger.error("Unable to create command log:", error);
  }
}
