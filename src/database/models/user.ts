import { IUser } from "../../common/types.js";
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

export class User extends Model<IUser> implements IUser {
  declare name: string;
  declare description: string;
  declare username: string;
  declare usage_count: number;
}

User.init(
  {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
  }
);
