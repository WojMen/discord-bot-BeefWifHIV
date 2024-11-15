import logger from "../common/logger.js";
import { Op } from "sequelize";
import { ICommandLog, IGweiRequest } from "../common/types.js";
import { GweiRequest } from "../database/models/gweiRequest.js";
import { createCommandLog } from "./commandLogsService.js";

export async function createGweiRequest(gweiRequest: IGweiRequest): Promise<boolean> {
  try {
    const newGweiRequest = await GweiRequest.create(gweiRequest);
    console.log("New GweiRequest:", newGweiRequest.toJSON());

    const commandLog = {
      name: "gweiRequest",
      channelId: gweiRequest.channelId,
      userId: gweiRequest.userId,
      parameters: { value: newGweiRequest.value, usersToNotify: newGweiRequest.usersToNotify },
      active: false,
    } as ICommandLog;

    console.log("New command:", commandLog);

    await createCommandLog(commandLog);

    return true;
  } catch (error) {
    logger.error("Unable to create createGweiRequest:", error);
    return false;
  }
}

export async function updateStatusGweiRequests(gweiRequestIds: number[]): Promise<boolean> {
  try {
    const isUpdated = await GweiRequest.update({ active: false }, { where: { id: { [Op.in]: gweiRequestIds } } });

    if (isUpdated[0] === 0) {
      logger.error(`Unable to update any GweiRequests with ids ${gweiRequestIds.join(", ")}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Unable to update GweiRequests:", error);
    return false;
  }
}

export async function getGweiRequests(active: boolean = true): Promise<GweiRequest[]> {
  try {
    const gweiRequests = await GweiRequest.findAll({ where: { active: active } });

    return gweiRequests;
  } catch (error) {
    logger.error("Unable to get getGweiRequests:", error);
    return [];
  }
}
