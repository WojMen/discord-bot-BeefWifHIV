import { DataTypes, Model } from "sequelize";
import { IGeneralAPI } from "../../common/types.js";
import { sequelize } from "../db.js";

export class GeneralAPI extends Model<IGeneralAPI> implements IGeneralAPI {
  declare type: number;
  declare response: any;
  declare value: any;
  declare error: string;
}

GeneralAPI.init(
  {
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    error: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "CommandLogs",
    tableName: "commands_logs",
  }
);
