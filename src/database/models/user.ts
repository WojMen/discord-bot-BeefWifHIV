import { IUser, IUserCreationAttributes } from "../../common/types.js";
import { DataTypes, Model, CreationOptional } from "sequelize";
import { sequelize } from "../db.js";

export class User extends Model<IUser, IUserCreationAttributes> implements IUser {
  declare name: string;
  declare description: string | null;
  declare username: string;
  declare usage_count: number;

  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
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
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true, // Ensures Sequelize automatically adds createdAt and updatedAt
  }
);
