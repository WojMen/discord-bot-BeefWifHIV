import { IGweiRequest } from "../../common/types.js";
import { DataTypes, Model, CreationOptional } from "sequelize";
import { sequelize } from "../db.js";

export class GweiRequest extends Model<IGweiRequest> implements IGweiRequest {
  declare value: number;
  declare channelId: string;
  declare userId: string;
  declare usersToNotify?: string[] | null;
  declare active: boolean;

  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

GweiRequest.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    usersToNotify: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "GweiRequest",
    tableName: "gwei_requests",
  }
);
