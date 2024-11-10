import { DataTypes, Model } from "sequelize";
import { ICommandLog } from "../../common/types.js";
import { sequelize } from "../db.js";

export class CommandLog extends Model<ICommandLog> implements ICommandLog {
  declare name: string;
  declare channelId: string;
  declare userId: string;
  declare parameters: Record<string, any>;
  declare active: boolean;
}

CommandLog.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "CommandLogs",
    tableName: "commands_logs",
  }
);
