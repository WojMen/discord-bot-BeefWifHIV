import { IGeneralAPI } from "../../common/types.js";
import { DataTypes, Model, CreationOptional } from "sequelize";
import { sequelize } from "../db.js";

export class GeneralAPI extends Model<IGeneralAPI> implements IGeneralAPI {
  declare type: number;
  declare response: any;
  declare value: any;
  declare error: string;

  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

GeneralAPI.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
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
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "GeneralAPI",
    tableName: "general_api",
  }
);
