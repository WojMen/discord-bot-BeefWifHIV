import { IBizPost } from "../../common/types.js";
import { DataTypes, Model, CreationOptional } from "sequelize";
import { sequelize } from "../db.js";

export class BizPost extends Model<IBizPost> implements IBizPost {
  declare threadId: number;
  declare postId: number;
  declare time: string;
  declare timeUNIX: number;
  declare link: string;
  declare capcode: string;
  declare name: string;
  declare filename: string;
  declare comment: string;
  declare matchedKeyWords: string[];
  declare matchedPatterns: string[];

  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BizPost.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    threadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timeUNIX: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    matchedKeyWords: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    matchedPatterns: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "posts",
  }
);
